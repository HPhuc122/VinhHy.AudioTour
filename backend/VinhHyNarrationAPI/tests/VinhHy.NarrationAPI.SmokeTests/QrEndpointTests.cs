using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class QrEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task QrEndpoints_SupportCrudAndCodeLookupForPoiAndTourTargets()
    {
        await AuthenticateAsync();
        var (poiId, tourId) = await SeedTargetsAsync();

        var createResponse = await _client.PostAsJsonAsync(
            "/api/v1/qr",
            new CreateQrRequest
            {
                PoiId = poiId,
                IsActive = true
            });

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var qrId = await GetDataPropertyAsync<int>(createResponse, "id");
        var generatedCode = await GetDataPropertyAsync<string>(createResponse, "code");

        var listResponse = await _client.GetAsync("/api/v1/qr");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var detailResponse = await _client.GetAsync($"/api/v1/qr/{qrId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);
        Assert.Equal(poiId, await GetDataPropertyAsync<int?>(detailResponse, "poiId"));

        var codeResponse = await _client.GetAsync($"/api/v1/qr/code/{generatedCode}");
        Assert.Equal(HttpStatusCode.OK, codeResponse.StatusCode);
        Assert.Equal(generatedCode, await GetDataPropertyAsync<string>(codeResponse, "code"));

        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/v1/qr/{qrId}",
            new UpdateQrRequest
            {
                TourId = tourId,
                IsActive = true
            });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Null(await GetDataPropertyAsync<int?>(updateResponse, "poiId"));
        Assert.Equal(tourId, await GetDataPropertyAsync<int?>(updateResponse, "tourId"));

        var tourCodeResponse = await _client.GetAsync($"/api/v1/qr/code/{generatedCode}");
        Assert.Equal(HttpStatusCode.OK, tourCodeResponse.StatusCode);
        Assert.Equal(tourId, await GetDataPropertyAsync<int?>(tourCodeResponse, "tourId"));

        var deleteResponse = await _client.DeleteAsync($"/api/v1/qr/{qrId}");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);

        var deletedCodeResponse = await _client.GetAsync($"/api/v1/qr/code/{generatedCode}");
        Assert.Equal(HttpStatusCode.NotFound, deletedCodeResponse.StatusCode);
    }

    [Fact]
    public async Task CreateQr_WithoutTarget_CreatesServiceLevelQr()
    {
        await AuthenticateAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/qr",
            new CreateQrRequest
            {
                IsActive = true,
                RequiresPayment = true,
                PriceAmount = 25000m,
                AccessDurationMinutes = 90
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Null(await GetDataPropertyAsync<int?>(response, "poiId"));
        Assert.Null(await GetDataPropertyAsync<int?>(response, "tourId"));
        Assert.Equal(25000m, await GetDataPropertyAsync<decimal>(response, "priceAmount"));
        Assert.Equal(90, await GetDataPropertyAsync<int>(response, "accessDurationMinutes"));
    }

    [Fact]
    public async Task CreateQr_WithRequiredPaymentAndZeroPrice_ReturnsBadRequest()
    {
        await AuthenticateAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/qr",
            new CreateQrRequest
            {
                RequiresPayment = true,
                PriceAmount = 0m,
                AccessDurationMinutes = 60
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task AuthenticateAsync()
    {
        var loginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "ChangeMe123!" });

        loginResponse.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await loginResponse.Content.ReadAsStringAsync());
        var token = doc.RootElement.GetProperty("data").GetProperty("accessToken").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private async Task<(int PoiId, int TourId)> SeedTargetsAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var suffix = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var poi = new Poi
        {
            Code = $"POI-QR-{suffix}",
            Latitude = 11.750000m,
            Longitude = 109.180000m,
            RadiusMeters = 30,
            Priority = 1,
            IsActive = true,
            Category = "smoke-test",
            CreatedAt = now,
            UpdatedAt = now
        };

        var tour = new Tour
        {
            Code = $"TOUR-QR-{suffix}",
            DefaultLanguage = "vi",
            EstimatedMinutes = 30,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.Pois.AddAsync(poi);
        await db.Tours.AddAsync(tour);
        await db.SaveChangesAsync();

        return (poi.Id, tour.Id);
    }

    private static async Task<T> GetDataPropertyAsync<T>(HttpResponseMessage response, string propertyName)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty(propertyName).Deserialize<T>()!;
    }
}
