using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class PoiTranslationConfiguration : IEntityTypeConfiguration<PoiTranslation>
{
    public void Configure(EntityTypeBuilder<PoiTranslation> builder)
    {
        builder.ToTable("POITranslations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.LanguageCode).HasMaxLength(10).IsRequired();
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Description).IsRequired();
        builder.Property(e => e.ShortDescription).HasMaxLength(500);
        builder.Property(e => e.Version).HasDefaultValue(1);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => new { e.POIId, e.LanguageCode }).IsUnique();
        builder.HasIndex(e => e.LanguageCode);

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.Translations)
            .HasForeignKey(e => e.POIId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
