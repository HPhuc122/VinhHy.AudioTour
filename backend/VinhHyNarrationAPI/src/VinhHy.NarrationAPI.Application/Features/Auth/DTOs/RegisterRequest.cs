namespace VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

public class RegisterRequest
{
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string PreferredLanguage { get; set; } = "vi";
}
