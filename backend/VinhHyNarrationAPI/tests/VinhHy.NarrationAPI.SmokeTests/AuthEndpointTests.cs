using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

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
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "wrong-password" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
