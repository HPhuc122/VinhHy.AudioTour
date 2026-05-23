using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class AnalyticsDailyConfiguration : IEntityTypeConfiguration<AnalyticsDaily>
{
    public void Configure(EntityTypeBuilder<AnalyticsDaily> builder)
    {
        builder.ToTable("AnalyticsDaily");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TotalPlays).HasDefaultValue(0);
        builder.Property(e => e.GpsPlays).HasDefaultValue(0);
        builder.Property(e => e.QrPlays).HasDefaultValue(0);
        builder.Property(e => e.ManualPlays).HasDefaultValue(0);
        builder.Property(e => e.UniqueDevices).HasDefaultValue(0);

        builder.HasIndex(e => new { e.POIId, e.Date }).IsUnique();
        builder.HasIndex(e => e.Date);

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.AnalyticsDaily)
            .HasForeignKey(e => e.POIId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
