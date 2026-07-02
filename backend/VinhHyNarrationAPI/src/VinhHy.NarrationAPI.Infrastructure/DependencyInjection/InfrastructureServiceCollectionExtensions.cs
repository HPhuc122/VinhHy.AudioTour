using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Infrastructure.Data;
using VinhHy.NarrationAPI.Infrastructure.Options;
using VinhHy.NarrationAPI.Infrastructure.Repositories;
using VinhHy.NarrationAPI.Infrastructure.Services;

namespace VinhHy.NarrationAPI.Infrastructure.DependencyInjection;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<TranslationOptions>(configuration.GetSection(TranslationOptions.SectionName));

        var useInMemory = configuration.GetValue<bool>("UseInMemoryDatabase");

        if (useInMemory)
        {
            var inMemoryName = configuration.GetValue<string>("InMemoryDatabaseName") ?? "VinhHyNarrationTests";
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(inMemoryName));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString, sql =>
                    sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
        }

        services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>(
                name: "database",
                tags: ["ready", "db"]);

        RegisterRepositories(services);
        RegisterServices(services);
        ConfigureJwtAuthentication(services, configuration);

        // In-memory presence tracking (singleton — lives for the lifetime of the process)
        services.AddSingleton<PresenceStore>();
        services.AddHostedService<PresencePurgeService>();

        // Auto-translate + TTS pipeline (runs after admin approves a NarrationDraft)
        services.AddSingleton<IAutoTranslateTtsQueue, AutoTranslateTtsQueue>();
        services.AddHostedService<AutoTranslateTtsPipelineService>();
        services.AddHostedService<NarrationDraftTextChangeMonitorService>();

        return services;
    }

    public static async Task MigrateDatabaseAsync(
        this IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (db.Database.IsRelational())
        {
            await db.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);
        }
        else
        {
            await db.Database.EnsureCreatedAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private static void RegisterRepositories(IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<ILanguageRepository, LanguageRepository>();
        services.AddScoped<IDeviceRepository, DeviceRepository>();
        services.AddScoped<IPoiRepository, PoiRepository>();
        services.AddScoped<IPoiTranslationRepository, PoiTranslationRepository>();
        services.AddScoped<IAudioTrackRepository, AudioTrackRepository>();
        services.AddScoped<IMediaRepository, MediaRepository>();
        services.AddScoped<ITourRepository, TourRepository>();
        services.AddScoped<ITourTranslationRepository, TourTranslationRepository>();
        services.AddScoped<ITourPoiRepository, TourPoiRepository>();
        services.AddScoped<IQrRepository, QrRepository>();
        services.AddScoped<IGuestAccessPassRepository, GuestAccessPassRepository>();
        services.AddScoped<IAccessPaymentSessionRepository, AccessPaymentSessionRepository>();
        services.AddScoped<INarrationLogRepository, NarrationLogRepository>();
        services.AddScoped<IOfflinePackageRepository, OfflinePackageRepository>();
        services.AddScoped<ISyncRepository, SyncRepository>();
        services.AddScoped<IDeletedRecordRepository, DeletedRecordRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IAnalyticsRepository, AnalyticsRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
    }

    private static void RegisterServices(IServiceCollection services)
    {
        services.AddScoped<JwtTokenService>();
        services.AddScoped<SoftDeleteService>();
        services.AddScoped<AuditLogWriter>();
        services.AddScoped<IFileUploadService, FileUploadService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IPoiService, PoiService>();
        services.AddScoped<IPublicPoiService, PublicPoiService>();
        services.AddHttpClient<IPublicRouteService, PublicRouteService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(20);
        });
        services.AddScoped<IPoiTranslationService, PoiTranslationService>();
        services.AddScoped<IAudioService, AudioService>();
        services.AddScoped<IMediaService, MediaService>();
        services.AddScoped<INarrationDraftService, NarrationDraftService>();
        services.AddScoped<ITourService, TourService>();
        services.AddScoped<IQrService, QrService>();
        services.AddScoped<IPublicAccessService, PublicAccessService>();
        services.AddScoped<IPublicAudioTourService, PublicAudioTourService>();
        services.AddScoped<ISyncService, SyncService>();
        services.AddScoped<IOfflinePackageService, OfflinePackageService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<INarrationLogService, NarrationLogService>();
        services.AddScoped<IGeofenceConfigService, GeofenceConfigService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<ILanguageService, LanguageService>();
        services.AddScoped<IDeviceService, DeviceService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<ITranslationProviderStatusService, TranslationProviderStatusService>();
        services.AddScoped<SimulatedTranslationProvider>();
        services.AddHttpClient<GoogleTranslateProvider>((sp, client) =>
        {
            var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<TranslationOptions>>();
            var timeoutSeconds = options.Value.GoogleTranslate.TimeoutSeconds > 0
                ? options.Value.GoogleTranslate.TimeoutSeconds
                : 30;
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        });
        services.AddHttpClient<GoogleTtsService>((sp, client) =>
        {
            var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<TranslationOptions>>();
            var timeoutSeconds = options.Value.GoogleTranslate.TimeoutSeconds > 0
                ? options.Value.GoogleTranslate.TimeoutSeconds
                : 60; // TTS có thể mất lâu hơn
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        });
        services.AddScoped<IGoogleTtsService, GoogleTtsService>();
        services.AddScoped<ITranslationProvider>(sp =>
        {
            var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<TranslationOptions>>();
            return TranslationProviderNames.Normalize(options.Value.Provider) == TranslationProviderNames.GoogleTranslate
                ? sp.GetRequiredService<GoogleTranslateProvider>()
                : sp.GetRequiredService<SimulatedTranslationProvider>();
        });
    }

    private static void ConfigureJwtAuthentication(IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
            ?? throw new InvalidOperationException("JWT settings are not configured.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwt.Issuer,
                ValidAudience = jwt.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });

        services.AddAuthorization();
    }
}
