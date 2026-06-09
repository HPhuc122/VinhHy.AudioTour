using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Language> Languages => Set<Language>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Device> Devices => Set<Device>();

    public DbSet<Poi> Pois => Set<Poi>();

    public DbSet<PoiTranslation> PoiTranslations => Set<PoiTranslation>();

    public DbSet<AudioTrack> AudioTracks => Set<AudioTrack>();

    public DbSet<MediaFile> MediaFiles => Set<MediaFile>();

    public DbSet<Tour> Tours => Set<Tour>();

    public DbSet<TourTranslation> TourTranslations => Set<TourTranslation>();

    public DbSet<TourPoi> TourPois => Set<TourPoi>();

    public DbSet<QrLocation> QrLocations => Set<QrLocation>();

    public DbSet<NarrationLog> NarrationLogs => Set<NarrationLog>();

    public DbSet<OfflinePackage> OfflinePackages => Set<OfflinePackage>();

    public DbSet<SyncHistory> SyncHistory => Set<SyncHistory>();

    public DbSet<DeletedRecord> DeletedRecords => Set<DeletedRecord>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<ContentVersion> ContentVersions => Set<ContentVersion>();

    public DbSet<AnalyticsDaily> AnalyticsDaily => Set<AnalyticsDaily>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        modelBuilder.Entity<Poi>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<AudioTrack>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<Tour>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<QrLocation>().HasQueryFilter(e => e.DeletedAt == null);
    }
}
