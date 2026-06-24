namespace VinhHy.NarrationAPI.Application.Features.Users.DTOs;

public class UpdateUserRequest
{
    public string? Password { get; set; }

    public int? RoleId { get; set; }

    public string? PreferredLanguage { get; set; }

    public bool? IsActive { get; set; }
}
