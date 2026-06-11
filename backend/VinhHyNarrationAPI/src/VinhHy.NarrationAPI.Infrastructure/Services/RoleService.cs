using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Roles.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class RoleService : IRoleService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public RoleService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _uow.Roles.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<RoleDto>>(roles);
    }

    public async Task<RoleDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var role = await _uow.Roles.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return role is null ? null : _mapper.Map<RoleDto>(role);
    }

    public async Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken cancellationToken = default)
    {
        if (await _uow.Roles.GetByNameAsync(request.Name, cancellationToken).ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.Name), $"Role '{request.Name}' already exists.");

        var role = new Role
        {
            Name = request.Name,
            Description = request.Description
        };

        await _uow.Roles.AddAsync(role, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<RoleDto>(role);
    }

    public async Task<RoleDto> UpdateAsync(int id, UpdateRoleRequest request, CancellationToken cancellationToken = default)
    {
        var role = await _uow.Roles.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Role), id);

        if (request.Name is not null)
        {
            var existing = await _uow.Roles.GetByNameAsync(request.Name, cancellationToken).ConfigureAwait(false);
            if (existing is not null && existing.Id != id)
                throw new ValidationException(nameof(request.Name), $"Role '{request.Name}' already exists.");

            role.Name = request.Name;
        }

        if (request.Description is not null)
            role.Description = request.Description;

        _uow.Roles.Update(role);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<RoleDto>(role);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var role = await _uow.Roles.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Role), id);

        _uow.Roles.Delete(role);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
