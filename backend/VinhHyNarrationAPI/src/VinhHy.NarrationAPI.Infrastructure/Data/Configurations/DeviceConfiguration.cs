using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    public void Configure(EntityTypeBuilder<Device> builder)
    {
        builder.ToTable("Devices");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.DeviceId).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Platform).HasMaxLength(20).IsRequired();
        builder.Property(e => e.AppVersion).HasMaxLength(20);
        builder.Property(e => e.OsVersion).HasMaxLength(50);
        builder.Property(e => e.PushToken).HasMaxLength(512);
        builder.Property(e => e.LastSeenAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.RegisteredAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => e.DeviceId).IsUnique();
        builder.HasIndex(e => e.UserId);

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Devices_Platform",
            "[Platform] IN ('android', 'ios', 'windows')"));

        builder.HasOne(e => e.User)
            .WithMany(u => u.Devices)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
