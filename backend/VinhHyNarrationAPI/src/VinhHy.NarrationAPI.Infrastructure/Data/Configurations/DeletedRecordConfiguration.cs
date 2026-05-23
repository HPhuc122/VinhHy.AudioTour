using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class DeletedRecordConfiguration : IEntityTypeConfiguration<DeletedRecord>
{
    public void Configure(EntityTypeBuilder<DeletedRecord> builder)
    {
        builder.ToTable("DeletedRecords");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.EntityType).HasMaxLength(50).IsRequired();
        builder.Property(e => e.DeletedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => new { e.EntityType, e.DeletedAt });

        builder.HasOne(e => e.DeletedByUser)
            .WithMany(u => u.DeletedRecords)
            .HasForeignKey(e => e.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
