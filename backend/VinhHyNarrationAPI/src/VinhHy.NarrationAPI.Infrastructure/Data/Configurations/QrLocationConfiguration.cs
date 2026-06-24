using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class QrLocationConfiguration : IEntityTypeConfiguration<QrLocation>
{
    public void Configure(EntityTypeBuilder<QrLocation> builder)
    {
        builder.ToTable("QRLocations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Name).HasMaxLength(200);
        builder.Property(e => e.IsActive).HasDefaultValue(true);
        builder.Property(e => e.RequiresPayment).HasDefaultValue(false);
        builder.Property(e => e.PriceAmount).HasPrecision(18, 2).HasDefaultValue(0m);
        builder.Property(e => e.AccessDurationMinutes).HasDefaultValue(60);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => e.Code).IsUnique();
        builder.HasIndex(e => e.DeletedAt)
            .HasFilter("[DeletedAt] IS NOT NULL");

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.QrLocations)
            .HasForeignKey(e => e.PoiId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Tour)
            .WithMany()
            .HasForeignKey(e => e.TourId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_QRLocations_Target",
                "NOT ([PoiId] IS NOT NULL AND [TourId] IS NOT NULL)");
            t.HasCheckConstraint(
                "CK_QRLocations_PaymentConfig",
                "[PriceAmount] >= 0 AND [AccessDurationMinutes] > 0");
        });
    }
}
