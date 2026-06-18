using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

    Task<DeviceRegistrationResponse> RegisterDeviceAsync(
        RegisterDeviceRequest request,
        CancellationToken cancellationToken = default);

    Task RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
}
