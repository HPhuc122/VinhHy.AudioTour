namespace VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

public class LoginResponse
{
    public string AccessToken { get; set; } = null!;

    public string RefreshToken { get; set; } = null!;

    public DateTime ExpiresAtUtc { get; set; }

    public int UserId { get; set; }

    public string Username { get; set; } = null!;

    public string Role { get; set; } = null!;

    public string PreferredLanguage { get; set; } = "vi";
}
