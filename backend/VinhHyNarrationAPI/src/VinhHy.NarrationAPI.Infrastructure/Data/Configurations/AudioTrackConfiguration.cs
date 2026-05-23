using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class AudioTrackConfiguration : IEntityTypeConfiguration<AudioTrack>
{
    public void Configure(EntityTypeBuilder<AudioTrack> builder)
    {
        builder.ToTable("AudioTracks");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.LanguageCode).HasMaxLength(10).IsRequired();
        builder.Property(e => e.AudioType).HasMaxLength(20).HasDefaultValue("tts");
        builder.Property(e => e.FileUrl).HasMaxLength(500);
        builder.Property(e => e.MimeType).HasMaxLength(50).HasDefaultValue("audio/mp4");
        builder.Property(e => e.IsActive).HasDefaultValue(true);
        builder.Property(e => e.Version).HasDefaultValue(1);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => new { e.POIId, e.LanguageCode }).IsUnique();
        builder.HasIndex(e => e.UpdatedAt);
        builder.HasIndex(e => new { e.POIId, e.LanguageCode })
            .HasFilter("[IsActive] = 1 AND [DeletedAt] IS NULL");

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_AudioTracks_Type", "[AudioType] IN ('tts', 'prerecorded')");
            t.HasCheckConstraint(
                "CK_AudioTracks_File",
                "([AudioType] = 'prerecorded' AND [FileUrl] IS NOT NULL) OR ([AudioType] = 'tts' AND [TTSText] IS NOT NULL)");
        });

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.AudioTracks)
            .HasForeignKey(e => e.POIId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
