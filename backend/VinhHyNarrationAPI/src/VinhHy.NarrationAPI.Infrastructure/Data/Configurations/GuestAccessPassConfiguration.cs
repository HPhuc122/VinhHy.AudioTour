using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class GuestAccessPassConfiguration : IEntityTypeConfiguration<GuestAccessPass>
{
    public void Configure(EntityTypeBuilder<GuestAccessPass> builder)
    {
        builder.ToTable("GuestAccessPasses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TokenHash).HasMaxLength(128);
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.Currency).HasMaxLength(8).IsRequired().HasDefaultValue("VND");
        builder.Property(e => e.Status).HasMaxLength(32).IsRequired();
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => e.TokenHash)
            .IsUnique()
            .HasFilter("[TokenHash] IS NOT NULL");
        builder.HasIndex(e => new { e.QrLocationId, e.Status });
        builder.HasIndex(e => e.ExpiresAt);

        builder.HasOne(e => e.QrLocation)
            .WithMany(q => q.GuestAccessPasses)
            .HasForeignKey(e => e.QrLocationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
