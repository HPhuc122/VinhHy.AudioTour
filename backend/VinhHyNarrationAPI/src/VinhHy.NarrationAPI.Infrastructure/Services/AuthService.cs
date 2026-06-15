using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly JwtTokenService _jwt;

    public AuthService(IUnitOfWork uow, JwtTokenService jwt)
    {
        _uow = uow;
        _jwt = jwt;
    }

    public async Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _uow.Users.GetByUsernameAsync(request.Username, cancellationToken)
            .ConfigureAwait(false);

        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid username or password.");

        return await IssueTokensAsync(user, cancellationToken).ConfigureAwait(false);
    }

    public async Task<LoginResponse> RefreshTokenAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await FindUserByRefreshTokenAsync(request.RefreshToken, cancellationToken)
            .ConfigureAwait(false);

        if (user is null || !user.IsActive
            || user.RefreshToken != request.RefreshToken
            || user.RefreshTokenExpiry is null
            || user.RefreshTokenExpiry <= DateTime.UtcNow)
            throw new UnauthorizedException("Invalid or expired refresh token.");

        return await IssueTokensAsync(user, cancellationToken).ConfigureAwait(false);
    }

    public async Task<DeviceRegistrationResponse> RegisterDeviceAsync(
        RegisterDeviceRequest request,
        CancellationToken cancellationToken = default)
    {
        var existing = await _uow.Devices.GetByDeviceIdAsync(request.DeviceId, cancellationToken)
            .ConfigureAwait(false);

        var now = DateTime.UtcNow;

        if (existing is not null)
        {
            existing.Platform = request.Platform;
            existing.AppVersion = request.AppVersion;
            existing.OsVersion = request.OsVersion;
            existing.PushToken = request.PushToken;
            existing.LastSeenAt = now;
            _uow.Devices.Update(existing);
        }
        else
        {
            existing = new Device
            {
                DeviceId = request.DeviceId,
                Platform = request.Platform,
                AppVersion = request.AppVersion,
                OsVersion = request.OsVersion,
                PushToken = request.PushToken,
                LastSeenAt = now,
                RegisteredAt = now
            };
            await _uow.Devices.AddAsync(existing, cancellationToken).ConfigureAwait(false);
        }

        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new DeviceRegistrationResponse
        {
            Id = existing.Id,
            DeviceId = existing.DeviceId,
            Platform = existing.Platform,
            RegisteredAt = existing.RegisteredAt
        };
    }

    public async Task<LoginResponse> RegisterAsync(
    RegisterRequest request,
    CancellationToken cancellationToken = default)
    {
        // Kiểm tra username đã tồn tại chưa
        var existingByUsername = await _uow.Users.GetByUsernameAsync(request.Username, cancellationToken)
            .ConfigureAwait(false);
        if (existingByUsername is not null)
            throw new ValidationException(nameof(request.Username), "Tên đăng nhập đã được sử dụng.");

        // Kiểm tra email đã tồn tại chưa
        var existingByEmail = await _uow.Users.GetByEmailAsync(request.Email, cancellationToken)
            .ConfigureAwait(false);
        if (existingByEmail is not null)
            throw new ValidationException(nameof(request.Email), "Email đã được sử dụng.");

        // Lấy role Guest (mặc định cho khách đăng ký)
        var guestRole = await _uow.Roles.GetByNameAsync("Guest", cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Role", "Guest");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = guestRole.Id,
            PreferredLanguage = request.PreferredLanguage,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _uow.Users.AddAsync(user, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Load role navigation để IssueTokensAsync có Role.Name
        user.Role = guestRole;

        return await IssueTokensAsync(user, cancellationToken).ConfigureAwait(false);
    }

    private Task<User?> FindUserByRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken) =>
        _uow.Users.GetByRefreshTokenAsync(refreshToken, cancellationToken);

    private async Task<LoginResponse> IssueTokensAsync(User user, CancellationToken cancellationToken)
    {
        var (accessToken, expiresAt) = _jwt.GenerateAccessToken(user);
        var refreshToken = _jwt.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = _jwt.GetRefreshTokenExpiry();
        user.UpdatedAt = DateTime.UtcNow;
        _uow.Users.Update(user);

        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAtUtc = expiresAt,
            UserId = user.Id,
            Username = user.Username,
            Role = user.Role.Name,
            PreferredLanguage = user.PreferredLanguage
        };
    }
}
