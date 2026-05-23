using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class OfflinePackageConfiguration : IEntityTypeConfiguration<OfflinePackage>
{
    public void Configure(EntityTypeBuilder<OfflinePackage> builder)
    {
        builder.ToTable("OfflinePackages");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.LanguageCode).HasMaxLength(10).IsRequired();
        builder.Property(e => e.PackageVersion).HasMaxLength(20).IsRequired();
        builder.Property(e => e.DownloadUrl).HasMaxLength(500).IsRequired();
        builder.Property(e => e.FileSizeBytes).HasDefaultValue(0L);
        builder.Property(e => e.Checksum).HasMaxLength(64);
        builder.Property(e => e.IsActive).HasDefaultValue(true);
        builder.Property(e => e.PublishedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => new { e.TourId, e.LanguageCode, e.PackageVersion }).IsUnique();

        builder.HasOne(e => e.Tour)
            .WithMany(t => t.OfflinePackages)
            .HasForeignKey(e => e.TourId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
