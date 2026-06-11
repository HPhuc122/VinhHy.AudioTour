using VinhHy.NarrationAPI.Application.Features.Roles.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IRoleService
{
    Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<RoleDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);

    Task<RoleDto> UpdateAsync(int id, UpdateRoleRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
