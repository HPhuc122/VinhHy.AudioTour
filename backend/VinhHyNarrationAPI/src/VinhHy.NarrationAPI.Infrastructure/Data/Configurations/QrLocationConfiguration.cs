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

        builder.Property(e => e.QRCode).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Label).HasMaxLength(200);
        builder.Property(e => e.IsActive).HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => e.QRCode).IsUnique();

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.QrLocations)
            .HasForeignKey(e => e.POIId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
