using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class PoiConfiguration : IEntityTypeConfiguration<Poi>
{
    public void Configure(EntityTypeBuilder<Poi> builder)
    {
        builder.ToTable("POIs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Latitude).HasColumnType("decimal(9,6)");
        builder.Property(e => e.Longitude).HasColumnType("decimal(9,6)");
        builder.Property(e => e.RadiusMeters).HasColumnType("decimal(8,2)").HasDefaultValue(30m);
        builder.Property(e => e.Priority).HasDefaultValue(1);
        builder.Property(e => e.IsActive).HasDefaultValue(true);
        builder.Property(e => e.PaymentRequired).HasDefaultValue(false);
        builder.Property(e => e.PaymentStatus)
            .HasConversion<byte>()
            .HasDefaultValue(PoiPaymentStatus.NotRequired);
        builder.Property(e => e.ImageUrl).HasMaxLength(500);
        builder.Property(e => e.ImageUrls);
        builder.Property(e => e.Category).HasMaxLength(100);
        builder.Property(e => e.CooldownSeconds).HasDefaultValue(300);
        builder.Property(e => e.MinDwellSeconds).HasDefaultValue(5);
        builder.Property(e => e.Version).HasDefaultValue(1);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.Pois)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ActivatedByUser)
            .WithMany()
            .HasForeignKey(e => e.ActivatedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(e => e.Code).IsUnique();
        builder.HasIndex(e => e.UserId);
        builder.HasIndex(e => e.PaymentStatus);
        builder.HasIndex(e => e.ActivatedByUserId);
        builder.HasIndex(e => e.UpdatedAt);
        builder.HasIndex(e => e.DeletedAt)
            .HasFilter("[DeletedAt] IS NOT NULL");
        builder.HasIndex(e => new { e.Latitude, e.Longitude })
            .HasFilter("[IsActive] = 1 AND [DeletedAt] IS NULL");

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_POIs_Lat", "[Latitude] BETWEEN -90 AND 90");
            t.HasCheckConstraint("CK_POIs_Lon", "[Longitude] BETWEEN -180 AND 180");
            t.HasCheckConstraint("CK_POIs_Rad", "[RadiusMeters] > 0");
            t.HasCheckConstraint("CK_POIs_Cooldown", "[CooldownSeconds] >= 0");
            t.HasCheckConstraint("CK_POIs_Dwell", "[MinDwellSeconds] >= 0");
        });
    }
}
