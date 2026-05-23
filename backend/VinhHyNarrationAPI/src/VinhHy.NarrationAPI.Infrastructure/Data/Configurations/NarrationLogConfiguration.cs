using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class NarrationLogConfiguration : IEntityTypeConfiguration<NarrationLog>
{
    public void Configure(EntityTypeBuilder<NarrationLog> builder)
    {
        builder.ToTable("NarrationLogs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TriggerType).HasMaxLength(20).IsRequired();
        builder.Property(e => e.LanguageCode).HasMaxLength(10).IsRequired();
        builder.Property(e => e.DeviceId).HasMaxLength(200);
        builder.Property(e => e.PlayedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.Synced).HasDefaultValue(true);

        builder.HasIndex(e => new { e.UserId, e.PlayedAt });
        builder.HasIndex(e => new { e.POIId, e.PlayedAt });
        builder.HasIndex(e => e.PlayedAt);
        builder.HasIndex(e => e.Synced).HasFilter("[Synced] = 0");
        builder.HasIndex(e => new { e.DeviceId, e.PlayedAt })
            .HasFilter("[DeviceId] IS NOT NULL");

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_NarrationLogs_Trigger",
            "[TriggerType] IN ('gps', 'qr', 'manual')"));

        builder.HasOne(e => e.User)
            .WithMany(u => u.NarrationLogs)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.NarrationLogs)
            .HasForeignKey(e => e.POIId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Device)
            .WithMany(d => d.NarrationLogs)
            .HasForeignKey(e => e.DeviceId)
            .HasPrincipalKey(d => d.DeviceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
