using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Roles.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/roles")]
[Authorize(Roles = RoleGroups.AdminOnly)]
public class RolesController(IRoleService roleService) : ControllerBase
{
    /// <summary>GET /api/v1/roles — list all roles</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var roles = await roleService.GetAllAsync(cancellationToken);
        return this.ApiOk(roles);
    }

    /// <summary>GET /api/v1/roles/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var role = await roleService.GetByIdAsync(id, cancellationToken);
        if (role is null)
            throw new NotFoundException("Role", id);

        return this.ApiOk(role);
    }

    /// <summary>POST /api/v1/roles</summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateRoleRequest request,
        CancellationToken cancellationToken)
    {
        var role = await roleService.CreateAsync(request, cancellationToken);
        return this.ApiOk(role, "Role created");
    }

    /// <summary>PUT /api/v1/roles/{id}</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateRoleRequest request,
        CancellationToken cancellationToken)
    {
        var role = await roleService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(role, "Role updated");
    }

    /// <summary>DELETE /api/v1/roles/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await roleService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("Role deleted");
    }
}
