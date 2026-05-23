using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class TourPoiConfiguration : IEntityTypeConfiguration<TourPoi>
{
    public void Configure(EntityTypeBuilder<TourPoi> builder)
    {
        builder.ToTable("TourPOIs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.OrderIndex).HasDefaultValue(0);

        builder.HasIndex(e => new { e.TourId, e.POIId }).IsUnique();
        builder.HasIndex(e => new { e.TourId, e.OrderIndex });

        builder.HasOne(e => e.Tour)
            .WithMany(t => t.TourPois)
            .HasForeignKey(e => e.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.TourPois)
            .HasForeignKey(e => e.POIId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
