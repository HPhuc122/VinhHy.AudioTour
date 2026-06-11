namespace VinhHy.NarrationAPI.Application.Features.Roles.DTOs;

public class RoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}

public class CreateRoleRequest
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}

public class UpdateRoleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}
