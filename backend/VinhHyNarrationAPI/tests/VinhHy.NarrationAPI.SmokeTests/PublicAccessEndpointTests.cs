using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;
using VinhHy.NarrationAPI.Domain.Constants;
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

    [Fact]
    public async Task ServiceQrPass_AllowsAnyTourAudioTourEndpoint_AndRejectsMissingInvalidOrExpiredPass()
    {
        var (tourId, poiId) = await SeedAudioTourAsync();
        var qrCode = await SeedQrAsync(requiresPayment: false, priceAmount: 0m, durationMinutes: 60);

        var startResponse = await _client.PostAsJsonAsync(
            "/api/v1/public/access/start",
            new StartAccessRequest { QrCode = qrCode });

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        var accessToken = await GetDataPropertyAsync<string>(startResponse, "accessToken");

        var validRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/public/audio-tour/tours/{tourId}?languageCode=vi");
        validRequest.Headers.Add("X-Guest-Access-Token", accessToken);
        var validResponse = await _client.SendAsync(validRequest);

        Assert.Equal(HttpStatusCode.OK, validResponse.StatusCode);
        Assert.Equal(tourId, await GetDataPropertyAsync<int>(validResponse, "id"));
        var poiRequest = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/v1/public/audio-tour/pois/{poiId}?languageCode=vi");
        poiRequest.Headers.Add("X-Guest-Access-Token", accessToken);
        var poiResponse = await _client.SendAsync(poiRequest);
        Assert.Equal(HttpStatusCode.OK, poiResponse.StatusCode);
        using (var responseDoc = JsonDocument.Parse(await poiResponse.Content.ReadAsStringAsync()))
        {
            var audioTracks = responseDoc.RootElement
                .GetProperty("data")
                .GetProperty("audioTracks");
            Assert.NotEmpty(audioTracks.EnumerateArray());
            Assert.All(audioTracks.EnumerateArray(), track =>
                Assert.Equal("vi", track.GetProperty("languageCode").GetString()));
        }

        var missingResponse = await _client.GetAsync($"/api/v1/public/audio-tour/tours/{tourId}");
        Assert.Equal(HttpStatusCode.Unauthorized, missingResponse.StatusCode);

        var invalidRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/public/audio-tour/tours/{tourId}");
        invalidRequest.Headers.Add("X-Guest-Access-Token", "invalid-token");
        var invalidResponse = await _client.SendAsync(invalidRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, invalidResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pass = await db.GuestAccessPasses.SingleAsync(p => p.QrLocation.Code == qrCode);
            pass.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }

        var expiredRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/public/audio-tour/tours/{tourId}");
        expiredRequest.Headers.Add("X-Guest-Access-Token", accessToken);
        var expiredResponse = await _client.SendAsync(expiredRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, expiredResponse.StatusCode);
    }

    [Fact]
    public async Task PublicPoiAudioTourEndpoint_WhenTriggeredByGps_StoresGpsNarrationLog()
    {
        var (_, poiId) = await SeedAudioTourAsync();
        var qrCode = await SeedQrAsync(requiresPayment: false, priceAmount: 0m, durationMinutes: 60);

        var startResponse = await _client.PostAsJsonAsync(
            "/api/v1/public/access/start",
            new StartAccessRequest { QrCode = qrCode });

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        var accessToken = await GetDataPropertyAsync<string>(startResponse, "accessToken");

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/v1/public/audio-tour/pois/{poiId}?languageCode=vi&triggerType=gps");
        request.Headers.Add("X-Guest-Access-Token", accessToken);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var log = await db.NarrationLogs
            .Where(item => item.POIId == poiId)
            .OrderByDescending(item => item.Id)
            .FirstAsync();

        Assert.Equal(TriggerTypes.Gps, log.TriggerType);
        Assert.Equal("vi", log.LanguageCode);
        Assert.True(log.Synced);
    }

    private async Task<string> SeedQrAsync(bool requiresPayment, decimal priceAmount, int durationMinutes)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var suffix = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var qr = new QrLocation
        {
            Code = $"QR-ACCESS-{suffix}",
            IsActive = true,
            RequiresPayment = requiresPayment,
            PriceAmount = priceAmount,
            AccessDurationMinutes = durationMinutes,
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.QrLocations.AddAsync(qr);
        await db.SaveChangesAsync();

        return qr.Code;
    }

    private async Task<(int TourId, int PoiId)> SeedAudioTourAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var suffix = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var tour = new Tour
        {
            Code = $"TOUR-AUDIO-{suffix}",
            DefaultLanguage = "vi",
            EstimatedMinutes = 45,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var poi = new Poi
        {
            Code = $"POI-AUDIO-{suffix}",
            Latitude = 11.750000m,
            Longitude = 109.180000m,
            RadiusMeters = 30,
            Priority = 1,
            IsActive = true,
            LifecycleStatus = PoiLifecycleStatus.Active,
            Category = "audio-smoke",
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.Tours.AddAsync(tour);
        await db.Pois.AddAsync(poi);
        await db.SaveChangesAsync();

        await db.TourTranslations.AddAsync(new TourTranslation
        {
            TourId = tour.Id,
            LanguageCode = "vi",
            Name = "AudioTour Smoke",
            Description = "AudioTour smoke description"
        });

        await db.PoiTranslations.AddAsync(new PoiTranslation
        {
            POIId = poi.Id,
            LanguageCode = "vi",
            Name = "Audio POI",
            Description = "Narration text",
            ShortDescription = "Short narration",
            CreatedAt = now,
            UpdatedAt = now
        });

        await db.TourPois.AddAsync(new TourPoi
        {
            TourId = tour.Id,
            POIId = poi.Id,
            OrderIndex = 1
        });

        await db.AudioTracks.AddAsync(new AudioTrack
        {
            POIId = poi.Id,
            LanguageCode = "vi",
            AudioType = AudioTypes.Prerecorded,
            FileUrl = "uploads/audio/audio-tour-smoke.mp3",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        await db.AudioTracks.AddAsync(new AudioTrack
        {
            POIId = poi.Id,
            LanguageCode = "en",
            AudioType = AudioTypes.Prerecorded,
            FileUrl = "uploads/audio/audio-tour-smoke-en.mp3",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        await db.SaveChangesAsync();
        return (tour.Id, poi.Id);
    }

    private static async Task<T> GetDataPropertyAsync<T>(HttpResponseMessage response, string propertyName)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty(propertyName).Deserialize<T>()!;
    }
}
