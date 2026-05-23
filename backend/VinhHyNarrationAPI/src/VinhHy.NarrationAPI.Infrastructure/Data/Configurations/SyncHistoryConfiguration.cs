using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class SyncHistoryConfiguration : IEntityTypeConfiguration<SyncHistory>
{
    public void Configure(EntityTypeBuilder<SyncHistory> builder)
    {
        builder.ToTable("SyncHistory");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.SyncType).HasMaxLength(50).IsRequired();
        builder.Property(e => e.DeviceId).HasMaxLength(200);
        builder.Property(e => e.SyncedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.Success).HasDefaultValue(true);

        builder.HasIndex(e => new { e.UserId, e.SyncedAt });
        builder.HasIndex(e => new { e.DeviceId, e.SyncedAt })
            .HasFilter("[DeviceId] IS NOT NULL");

        builder.HasOne(e => e.User)
            .WithMany(u => u.SyncHistories)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Device)
            .WithMany(d => d.SyncHistories)
            .HasForeignKey(e => e.DeviceId)
            .HasPrincipalKey(d => d.DeviceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
