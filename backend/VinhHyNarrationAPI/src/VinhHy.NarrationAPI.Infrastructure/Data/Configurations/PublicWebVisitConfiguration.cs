using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Configurations;

public class PublicWebVisitConfiguration : IEntityTypeConfiguration<PublicWebVisit>
{
    public void Configure(EntityTypeBuilder<PublicWebVisit> builder)
    {
        builder.ToTable("PublicWebVisits");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.SessionId)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(e => e.FirstSeenAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(e => new { e.SessionId, e.VisitDate }).IsUnique();
        builder.HasIndex(e => e.VisitDate);
    }
}
