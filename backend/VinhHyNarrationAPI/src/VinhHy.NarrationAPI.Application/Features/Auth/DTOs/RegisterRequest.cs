namespace VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

public class RegisterRequest
{
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string ConfirmPassword { get; set; } = null!;
    public string OwnerName { get; set; } = null!;
    public string StoreName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string PreferredLanguage { get; set; } = "vi";
}
