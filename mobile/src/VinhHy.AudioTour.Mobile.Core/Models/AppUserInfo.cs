namespace VinhHy.AudioTour.Mobile.Core.Models;

/// <summary>
/// Lightweight runtime snapshot of the authenticated user.
/// Does NOT contain JWT or refresh tokens — those live in SecureStorage only.
/// </summary>
public sealed class AppUserInfo
{
    public int UserId { get; init; }

    public string Username { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public string PreferredLanguage { get; init; } = "vi";
}
