namespace VinhHy.AudioTour.Mobile.Core.Models;

public sealed class AuthSession
{
    public string AccessToken { get; init; } = string.Empty;

    public string RefreshToken { get; init; } = string.Empty;

    public DateTime ExpiresAtUtc { get; init; }

    public int UserId { get; init; }

    public string Username { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public string PreferredLanguage { get; init; } = "vi";

  /// <summary>
    /// True when the access token is expired or within one minute of expiry.
    /// </summary>
    public bool IsAccessTokenExpired(DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        return now >= ExpiresAtUtc.AddMinutes(-1);
    }
}
