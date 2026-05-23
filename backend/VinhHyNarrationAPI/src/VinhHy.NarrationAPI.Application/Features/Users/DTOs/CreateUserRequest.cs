namespace VinhHy.NarrationAPI.Application.Features.Users.DTOs;

public class CreateUserRequest
{
    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public int RoleId { get; set; }

    public string PreferredLanguage { get; set; } = "vi";

    public bool IsActive { get; set; } = true;
}
