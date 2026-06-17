using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class AccessPaymentSessionConfiguration : IEntityTypeConfiguration<AccessPaymentSession>
{
    public void Configure(EntityTypeBuilder<AccessPaymentSession> builder)
    {
        builder.ToTable("AccessPaymentSessions");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Provider).HasMaxLength(32).IsRequired().HasDefaultValue("SimulatedMoMo");
        builder.Property(e => e.Status).HasMaxLength(32).IsRequired();
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.Currency).HasMaxLength(8).IsRequired().HasDefaultValue("VND");
        builder.Property(e => e.FailureReason).HasMaxLength(500);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => new { e.GuestAccessPassId, e.Status });
        builder.HasIndex(e => e.ExpiresAt);

        builder.HasOne(e => e.GuestAccessPass)
            .WithMany(p => p.PaymentSessions)
            .HasForeignKey(e => e.GuestAccessPassId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
