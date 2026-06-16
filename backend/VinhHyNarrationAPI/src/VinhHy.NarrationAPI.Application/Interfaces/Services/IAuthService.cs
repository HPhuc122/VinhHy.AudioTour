using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

    Task<DeviceRegistrationResponse> RegisterDeviceAsync(
        RegisterDeviceRequest request,
        CancellationToken cancellationToken = default);

    // [NEW] Đăng ký tài khoản khách public
    Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
}
