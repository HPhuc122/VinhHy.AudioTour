using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class PublicAccessEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task PaidQrAccess_StartsPayment_ActivatesAfterSimulation_AndStoresOnlyTokenHash()
    {
        var qrCode = await SeedQrAsync(requiresPayment: true, priceAmount: 50000m, durationMinutes: 60);

        var startResponse = await _client.PostAsJsonAsync(
            "/api/v1/public/access/start",
            new StartAccessRequest { QrCode = qrCode });

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        Assert.True(await GetDataPropertyAsync<bool>(startResponse, "requiresPayment"));
        Assert.Equal("PendingPayment", await GetDataPropertyAsync<string>(startResponse, "status"));
        Assert.Null(await GetDataPropertyAsync<string?>(startResponse, "accessToken"));
        var sessionId = await GetDataPropertyAsync<int>(startResponse, "paymentSessionId");

        var paymentResponse = await _client.PostAsJsonAsync(
            "/api/v1/public/access/simulate-payment",
            new SimulatePaymentRequest { PaymentSessionId = sessionId, Success = true });

        Assert.Equal(HttpStatusCode.OK, paymentResponse.StatusCode);
        Assert.Equal("Active", await GetDataPropertyAsync<string>(paymentResponse, "status"));
        var accessToken = await GetDataPropertyAsync<string>(paymentResponse, "accessToken");
        Assert.False(string.IsNullOrWhiteSpace(accessToken));

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var pass = await db.GuestAccessPasses.SingleAsync(p => p.PaymentSessions.Any(s => s.Id == sessionId));
        Assert.NotNull(pass.TokenHash);
        Assert.NotEqual(accessToken, pass.TokenHash);

        var validateRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/public/access/validate");
        validateRequest.Headers.Add("X-Guest-Access-Token", accessToken);
        var validateResponse = await _client.SendAsync(validateRequest);

        Assert.Equal(HttpStatusCode.OK, validateResponse.StatusCode);
        Assert.True(await GetDataPropertyAsync<bool>(validateResponse, "isValid"));
        Assert.Equal("Active", await GetDataPropertyAsync<string>(validateResponse, "status"));
    }

    [Fact]
    public async Task ValidateAccess_ExpiresPassServerSide()
    {
        var qrCode = await SeedQrAsync(requiresPayment: false, priceAmount: 0m, durationMinutes: 60);

        var startResponse = await _client.PostAsJsonAsync(
            "/api/v1/public/access/start",
            new StartAccessRequest { QrCode = qrCode });

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        var accessToken = await GetDataPropertyAsync<string>(startResponse, "accessToken");

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pass = await db.GuestAccessPasses.SingleAsync(p => p.QrLocation.Code == qrCode);
            pass.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }

        var validateRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/public/access/validate");
        validateRequest.Headers.Add("X-Guest-Access-Token", accessToken);
        var validateResponse = await _client.SendAsync(validateRequest);

        Assert.Equal(HttpStatusCode.OK, validateResponse.StatusCode);
        Assert.False(await GetDataPropertyAsync<bool>(validateResponse, "isValid"));
        Assert.Equal("Expired", await GetDataPropertyAsync<string>(validateResponse, "status"));
    }

    private async Task<string> SeedQrAsync(bool requiresPayment, decimal priceAmount, int durationMinutes)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var suffix = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var poi = new Poi
        {
            Code = $"POI-ACCESS-{suffix}",
            Latitude = 11.750000m,
            Longitude = 109.180000m,
            RadiusMeters = 30,
            Priority = 1,
            IsActive = true,
            Category = "smoke-test",
            CreatedAt = now,
            UpdatedAt = now
        };

        var qr = new QrLocation
        {
            Code = $"QR-ACCESS-{suffix}",
            Poi = poi,
            IsActive = true,
            RequiresPayment = requiresPayment,
            PriceAmount = priceAmount,
            AccessDurationMinutes = durationMinutes,
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.Pois.AddAsync(poi);
        await db.QrLocations.AddAsync(qr);
        await db.SaveChangesAsync();

        return qr.Code;
    }

    private static async Task<T> GetDataPropertyAsync<T>(HttpResponseMessage response, string propertyName)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty(propertyName).Deserialize<T>()!;
    }
}
