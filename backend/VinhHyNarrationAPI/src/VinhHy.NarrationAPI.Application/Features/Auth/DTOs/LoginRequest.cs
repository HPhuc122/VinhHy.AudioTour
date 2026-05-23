namespace VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

public class LoginRequest
{
    public string Username { get; set; } = null!;

    public string Password { get; set; } = null!;
}
