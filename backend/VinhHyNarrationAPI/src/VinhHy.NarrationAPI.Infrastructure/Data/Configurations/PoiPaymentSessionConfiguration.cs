using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class PoiPaymentSessionConfiguration : IEntityTypeConfiguration<PoiPaymentSession>
{
    public void Configure(EntityTypeBuilder<PoiPaymentSession> builder)
    {
        builder.ToTable("PoiPaymentSessions");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Provider).HasMaxLength(32).IsRequired().HasDefaultValue("SimulatedMoMo");
        builder.Property(e => e.Status).HasMaxLength(32).IsRequired();
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.Currency).HasMaxLength(8).IsRequired().HasDefaultValue("VND");
        builder.Property(e => e.FailureReason).HasMaxLength(500);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => new { e.PoiId, e.Status });
        builder.HasIndex(e => new { e.VendorUserId, e.Status });
        builder.HasIndex(e => e.ExpiresAt);

        builder.HasOne(e => e.Poi)
            .WithMany()
            .HasForeignKey(e => e.PoiId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.VendorUser)
            .WithMany()
            .HasForeignKey(e => e.VendorUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_PoiPaymentSessions_Amount", "[Amount] >= 0");
            t.HasCheckConstraint("CK_PoiPaymentSessions_Status", "[Status] IN ('Pending', 'Paid', 'Failed', 'Expired')");
        });
    }
}
