using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);
        return this.ApiOk(result, "Login successful");
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.RefreshTokenAsync(request, cancellationToken);
        return this.ApiOk(result, "Token refreshed");
    }

    [AllowAnonymous]
    [HttpPost("register-device")]
    public async Task<IActionResult> RegisterDevice(
        [FromBody] RegisterDeviceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.RegisterDeviceAsync(request, cancellationToken);
        return this.ApiOk(result, "Device registered");
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        await authService.RegisterAsync(request, cancellationToken);
        return this.ApiOk("Đăng ký tài khoản chủ sạp thành công. Vui lòng đăng nhập.");
    }
}
