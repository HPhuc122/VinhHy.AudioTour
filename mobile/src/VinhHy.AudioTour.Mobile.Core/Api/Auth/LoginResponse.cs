namespace VinhHy.AudioTour.Mobile.Core.Api.Auth;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;

    public string RefreshToken { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string PreferredLanguage { get; set; } = "vi";
}
