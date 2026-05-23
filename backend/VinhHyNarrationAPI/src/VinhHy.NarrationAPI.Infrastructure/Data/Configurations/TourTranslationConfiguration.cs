using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class TourTranslationConfiguration : IEntityTypeConfiguration<TourTranslation>
{
    public void Configure(EntityTypeBuilder<TourTranslation> builder)
    {
        builder.ToTable("TourTranslations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.LanguageCode).HasMaxLength(10).IsRequired();
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();

        builder.HasIndex(e => new { e.TourId, e.LanguageCode }).IsUnique();

        builder.HasOne(e => e.Tour)
            .WithMany(t => t.Translations)
            .HasForeignKey(e => e.TourId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
