using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class TourConfiguration : IEntityTypeConfiguration<Tour>
{
    public void Configure(EntityTypeBuilder<Tour> builder)
    {
        builder.ToTable("Tours");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code).HasMaxLength(50).IsRequired();
        builder.Property(e => e.DefaultLanguage).HasMaxLength(10).HasDefaultValue("vi");
        builder.Property(e => e.IsActive).HasDefaultValue(true);
        builder.Property(e => e.Version).HasDefaultValue(1);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasIndex(e => e.Code).IsUnique();
        builder.HasIndex(e => e.UpdatedAt);
        builder.HasIndex(e => e.DeletedAt)
            .HasFilter("[DeletedAt] IS NOT NULL");
    }
}
