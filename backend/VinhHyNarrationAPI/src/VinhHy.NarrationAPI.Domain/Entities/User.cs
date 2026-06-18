using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class User : IAuditableEntity
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public int RoleId { get; set; }

    public string PreferredLanguage { get; set; } = "vi";

    public bool IsActive { get; set; } = true;

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiry { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Role Role { get; set; } = null!;

    public ICollection<Device> Devices { get; set; } = [];

    public ICollection<NarrationLog> NarrationLogs { get; set; } = [];

    public ICollection<SyncHistory> SyncHistories { get; set; } = [];

    public ICollection<DeletedRecord> DeletedRecords { get; set; } = [];

    public ICollection<AuditLog> AuditLogs { get; set; } = [];

    public ICollection<ContentVersion> ContentVersions { get; set; } = [];

    public ICollection<Poi> Pois { get; set; } = [];
}
