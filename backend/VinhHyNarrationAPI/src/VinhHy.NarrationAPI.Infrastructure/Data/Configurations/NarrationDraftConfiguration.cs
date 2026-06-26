using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class NarrationDraftConfiguration : IEntityTypeConfiguration<NarrationDraft>
{
    public void Configure(EntityTypeBuilder<NarrationDraft> builder)
    {
        builder.ToTable("NarrationDrafts");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title).HasMaxLength(200).IsRequired();
        builder.Property(e => e.LanguageCode).HasMaxLength(10).IsRequired();
        builder.Property(e => e.TextContent).HasMaxLength(8000).IsRequired();
        builder.Property(e => e.Voice).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("Pending").IsRequired();
        builder.Property(e => e.RejectionReason).HasMaxLength(1000);
        builder.Property(e => e.SimulatedAudioUrl).HasMaxLength(500);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.SubmittedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.PoiId);
        builder.HasIndex(e => e.SubmittedAt);
        builder.HasIndex(e => new { e.SubmittedByUserId, e.Status });
        builder.HasIndex(e => new { e.PoiId, e.Status });
        builder.HasIndex(e => new { e.PoiId, e.LanguageCode }).IsUnique();

        builder.HasOne(e => e.Poi)
            .WithMany(p => p.NarrationDrafts)
            .HasForeignKey(e => e.PoiId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(e => e.SubmittedByUser)
            .WithMany()
            .HasForeignKey(e => e.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ReviewedByUser)
            .WithMany()
            .HasForeignKey(e => e.ReviewedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.GeneratedAudioTrack)
            .WithMany()
            .HasForeignKey(e => e.GeneratedAudioTrackId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_NarrationDrafts_Status",
                "[Status] IN ('Pending', 'Approved', 'Rejected', 'AudioGenerated', 'Translating')");
        });
    }
}
