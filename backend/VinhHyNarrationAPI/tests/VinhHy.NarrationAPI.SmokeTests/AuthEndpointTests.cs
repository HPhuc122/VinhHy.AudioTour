using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class AuthEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Login_WithValidAdmin_ReturnsSuccessEnvelope()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "ChangeMe123!" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetProperty("success").GetBoolean());
        Assert.True(doc.RootElement.GetProperty("data").TryGetProperty("accessToken", out _));
    }

    [Fact]
    public async Task Login_WithValidAdminEmail_ReturnsSuccessEnvelope()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin@vinhhy.local", Password = "ChangeMe123!" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetProperty("success").GetBoolean());
        Assert.True(doc.RootElement.GetProperty("data").TryGetProperty("accessToken", out _));
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "wrong-password" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_VendorRegistration_AllowsLoginAndRestrictsAdminEndpoints()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var suffix = Guid.NewGuid().ToString("N");
        var username = $"vendor-{suffix}";
        var password = "ChangeMe123!";

        var registerResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest
            {
                Username = username,
                Email = $"{username}@example.com",
                Password = password,
                ConfirmPassword = password,
                OwnerName = "Chu sap test",
                StoreName = "Sap test",
                PhoneNumber = "0900000000",
                PreferredLanguage = "vi"
            });

        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var vendorLoginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = username, Password = password });

        Assert.Equal(HttpStatusCode.OK, vendorLoginResponse.StatusCode);
        var vendorToken = await ReadAccessTokenAsync(vendorLoginResponse);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", vendorToken);
        Assert.Equal(HttpStatusCode.Forbidden, (await _client.GetAsync("/api/v1/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _client.GetAsync("/api/v1/roles")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _client.GetAsync("/api/v1/qr")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/api/v1/pois")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _client.GetAsync("/api/v1/tours")).StatusCode);

        using var audioUpload = new MultipartFormDataContent();
        audioUpload.Add(new ByteArrayContent([1, 2, 3]), "file", "vendor-audio.mp3");
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsync("/api/v1/media/upload", audioUpload)).StatusCode);

        var adminLoginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "ChangeMe123!" });

        Assert.Equal(HttpStatusCode.OK, adminLoginResponse.StatusCode);
        var adminToken = await ReadAccessTokenAsync(adminLoginResponse);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/api/v1/users")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/api/v1/roles")).StatusCode);
    }

    [Fact]
    public async Task Seed_IncludesAdminAndVendorRoles()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        Assert.True(await db.Roles.AnyAsync(role => role.Name == "Admin"));
        Assert.True(await db.Roles.AnyAsync(role => role.Name == "Vendor"));
        Assert.True(await db.Roles.AnyAsync(role => role.Name == "SuperAdmin"));
    }

    private static async Task<string> ReadAccessTokenAsync(HttpResponseMessage response)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty("accessToken").GetString()
            ?? throw new InvalidOperationException("Login response did not include an access token.");
    }
}
