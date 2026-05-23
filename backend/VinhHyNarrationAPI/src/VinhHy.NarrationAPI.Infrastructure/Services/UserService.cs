using AutoMapper;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Users.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UserService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<UserDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _uow.Users.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return user is null ? null : _mapper.Map<UserDto>(user);
    }

    public async Task<PagedResult<UserDto>> GetPagedAsync(
        PaginationRequest pagination,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await _uow.Users
            .GetPagedAsync(pagination.Page, pagination.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return PagedResult<UserDto>.Create(
            _mapper.Map<IReadOnlyList<UserDto>>(items),
            pagination.Page,
            pagination.PageSize,
            total);
    }

    public async Task<UserDto> CreateAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await _uow.Users.GetByUsernameAsync(request.Username, cancellationToken).ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.Username), "Username already exists.");

        if (await _uow.Users.GetByEmailAsync(request.Email, cancellationToken).ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.Email), "Email already exists.");

        var role = await _uow.Roles.GetByIdAsync(request.RoleId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Role), request.RoleId);

        var now = DateTime.UtcNow;
        var user = _mapper.Map<User>(request);
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.CreatedAt = now;
        user.UpdatedAt = now;
        user.Role = role;

        await _uow.Users.AddAsync(user, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> UpdateAsync(
        int id,
        UpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _uow.Users.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(User), id);

        if (request.Email is not null)
            user.Email = request.Email;

        if (request.RoleId.HasValue)
        {
            var role = await _uow.Roles.GetByIdAsync(request.RoleId.Value, cancellationToken).ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Role), request.RoleId.Value);
            user.RoleId = role.Id;
            user.Role = role;
        }

        if (request.PreferredLanguage is not null)
            user.PreferredLanguage = request.PreferredLanguage;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        if (!string.IsNullOrWhiteSpace(request.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        user.UpdatedAt = DateTime.UtcNow;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<UserDto>(user);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _uow.Users.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(User), id);

        _uow.Users.Delete(user);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
