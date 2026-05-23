using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Seed;

public static class DataSeeder
{
    private const string DefaultAdminUsername = "admin";
    private const string DefaultAdminEmail = "admin@vinhhy.local";
    private const string DefaultAdminPassword = "ChangeMe123!";

    public static async Task SeedAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        await SeedRolesAsync(db, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await SeedLanguagesAsync(db, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await SeedAdminUserAsync(db, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedRolesAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var roles = new[]
        {
            (RoleNames.SuperAdmin, "Full system access"),
            (RoleNames.ContentAdmin, "Manage POIs, audio, tours, QR"),
            (RoleNames.TourOperator, "Manage tours and offline packages"),
            (RoleNames.AnalyticsViewer, "Read analytics and narration logs"),
            (RoleNames.Guest, "Read-only public content")
        };

        foreach (var (name, description) in roles)
        {
            if (!await db.Roles.AnyAsync(r => r.Name == name, cancellationToken).ConfigureAwait(false))
            {
                await db.Roles.AddAsync(new Role { Name = name, Description = description }, cancellationToken)
                    .ConfigureAwait(false);
            }
        }
    }

    private static async Task SeedLanguagesAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var languages = new (string Code, string Name, string NativeName, int SortOrder)[]
        {
            ("vi", "Tiếng Việt", "Vietnamese", 1),
            ("en", "English", "English", 2),
            ("zh", "中文", "Chinese", 3),
            ("ko", "한국어", "Korean", 4),
            ("ja", "日本語", "Japanese", 5),
            ("fr", "Français", "French", 6)
        };

        foreach (var (code, name, nativeName, sortOrder) in languages)
        {
            if (!await db.Languages.AnyAsync(l => l.Code == code, cancellationToken).ConfigureAwait(false))
            {
                await db.Languages.AddAsync(
                    new Language
                    {
                        Code = code,
                        Name = name,
                        NativeName = nativeName,
                        SortOrder = sortOrder,
                        IsActive = true
                    },
                    cancellationToken).ConfigureAwait(false);
            }
        }
    }

    private static async Task SeedAdminUserAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        if (await db.Users.AnyAsync(u => u.Username == DefaultAdminUsername, cancellationToken).ConfigureAwait(false))
            return;

        var superAdmin = await db.Roles
            .FirstAsync(r => r.Name == RoleNames.SuperAdmin, cancellationToken)
            .ConfigureAwait(false);

        var now = DateTime.UtcNow;
        await db.Users.AddAsync(
            new User
            {
                Username = DefaultAdminUsername,
                Email = DefaultAdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultAdminPassword),
                RoleId = superAdmin.Id,
                PreferredLanguage = "vi",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            },
            cancellationToken).ConfigureAwait(false);
    }
}
