namespace VinhHy.AudioTour.Mobile.Core.Models;

/// <summary>
/// Serializable snapshot persisted in SecureStorage.
/// </summary>
public sealed class StoredAuthSession
{
    public string AccessToken { get; set; } = string.Empty;

    public string RefreshToken { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string PreferredLanguage { get; set; } = "vi";

    public static StoredAuthSession FromSession(AuthSession session) =>
        new()
        {
            AccessToken = session.AccessToken,
            RefreshToken = session.RefreshToken,
            ExpiresAtUtc = session.ExpiresAtUtc,
            UserId = session.UserId,
            Username = session.Username,
            Role = session.Role,
            PreferredLanguage = session.PreferredLanguage
        };

    public AuthSession ToSession() =>
        new()
        {
            AccessToken = AccessToken,
            RefreshToken = RefreshToken,
            ExpiresAtUtc = ExpiresAtUtc,
            UserId = UserId,
            Username = Username,
            Role = Role,
            PreferredLanguage = PreferredLanguage
        };
}
