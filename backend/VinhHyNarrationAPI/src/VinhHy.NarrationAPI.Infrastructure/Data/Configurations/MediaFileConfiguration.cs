using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class MediaFileConfiguration : IEntityTypeConfiguration<MediaFile>
{
    public void Configure(EntityTypeBuilder<MediaFile> builder)
    {
        builder.ToTable("MediaFiles");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.FileName).HasMaxLength(260).IsRequired();
        builder.Property(e => e.OriginalFileName).HasMaxLength(260).IsRequired();
        builder.Property(e => e.FileType).HasMaxLength(20).IsRequired();
        builder.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(e => e.RelativePath).HasMaxLength(500).IsRequired();
        builder.Property(e => e.ApprovalStatus).HasMaxLength(20).HasDefaultValue("Pending").IsRequired();
        builder.Property(e => e.RejectionReason).HasMaxLength(1000);
        builder.Property(e => e.UploadedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);

        builder.HasIndex(e => e.FileName).IsUnique();
        builder.HasIndex(e => e.FileType);
        builder.HasIndex(e => e.UploadedAt);
        builder.HasIndex(e => e.IsDeleted);
        builder.HasIndex(e => e.ApprovalStatus);
        builder.HasIndex(e => new { e.UploadedByUserId, e.FileType, e.ApprovalStatus });

        builder.HasOne(e => e.UploadedByUser)
            .WithMany()
            .HasForeignKey(e => e.UploadedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.ReviewedByUser)
            .WithMany()
            .HasForeignKey(e => e.ReviewedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_MediaFiles_FileSize", "[FileSize] > 0");
            t.HasCheckConstraint("CK_MediaFiles_FileType", "[FileType] IN ('image', 'audio')");
            t.HasCheckConstraint("CK_MediaFiles_ApprovalStatus", "[ApprovalStatus] IN ('Pending', 'Approved', 'Rejected')");
        });
    }
}
