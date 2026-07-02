using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class AnalyticsEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task DashboardEndpoint_ReturnsMemberThreeStats()
    {
        await AuthenticateAsync();
        await SeedDashboardDataAsync();
        var baselineTodayVisits = await CountTodaySiteVisitsAsync();

        var firstSession = $"dash-visit-{Guid.NewGuid():N}";
        var secondSession = $"dash-visit-{Guid.NewGuid():N}";
        await SendHeartbeatAsync(firstSession);
        await SendHeartbeatAsync(firstSession);
        await SendHeartbeatAsync(secondSession);

        var response = await _client.GetAsync("/api/v1/analytics/dashboard");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var data = doc.RootElement.GetProperty("data");

        Assert.True(data.GetProperty("totalTours").GetInt32() >= 2);
        Assert.True(data.GetProperty("activeTours").GetInt32() >= 1);
        Assert.True(data.GetProperty("totalQrCodes").GetInt32() >= 2);
        Assert.True(data.GetProperty("activeQrCodes").GetInt32() >= 1);
        Assert.True(data.GetProperty("totalMediaFiles").GetInt32() >= 2);
        Assert.True(data.GetProperty("totalImages").GetInt32() >= 1);
        Assert.True(data.GetProperty("totalAudioFiles").GetInt32() >= 1);
        Assert.True(data.GetProperty("deletedMediaFiles").GetInt32() >= 1);
        Assert.Equal(JsonValueKind.Null, data.GetProperty("totalTourViews").ValueKind);
        Assert.True(data.GetProperty("totalQrScans").GetInt32() >= 1);
        Assert.True(data.GetProperty("totalAudioPlays").GetInt32() >= 2);
        Assert.True(data.GetProperty("todaySiteVisits").GetInt32() >= baselineTodayVisits + 2);
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

    private async Task SendHeartbeatAsync(string sessionId)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/public/presence/heartbeat")
        {
            Content = JsonContent.Create(new { poiId = (string?)null })
        };
        request.Headers.Add("X-Guest-Device-Id", sessionId);

        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    private async Task<int> CountTodaySiteVisitsAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var todayIct = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));

        return await db.PublicWebVisits.CountAsync(v => v.VisitDate == todayIct);
    }

    private async Task SeedDashboardDataAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var suffix = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        var activeTour = new Tour
        {
            Code = $"TOUR-DASH-A-{suffix}",
            DefaultLanguage = "vi",
            EstimatedMinutes = 30,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var inactiveTour = new Tour
        {
            Code = $"TOUR-DASH-I-{suffix}",
            DefaultLanguage = "vi",
            EstimatedMinutes = 45,
            IsActive = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        var poi = new Poi
        {
            Code = $"POI-DASH-{suffix}",
            Latitude = 11.750000m,
            Longitude = 109.180000m,
            RadiusMeters = 30,
            Priority = 1,
            IsActive = true,
            Category = "smoke-test",
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.Tours.AddRangeAsync(activeTour, inactiveTour);
        await db.Pois.AddAsync(poi);
        await db.SaveChangesAsync();

        await db.AudioTracks.AddAsync(new AudioTrack
        {
            POIId = poi.Id,
            LanguageCode = "vi",
            Title = $"Dashboard audio {suffix}",
            AudioType = "tts",
            TTSText = "Noi dung thuyet minh dashboard.",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        await db.QrLocations.AddRangeAsync(
            new QrLocation
            {
                Code = $"QR-DASH-A-{suffix}",
                TourId = activeTour.Id,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            },
            new QrLocation
            {
                Code = $"QR-DASH-I-{suffix}",
                TourId = inactiveTour.Id,
                IsActive = false,
                CreatedAt = now,
                UpdatedAt = now
            });

        await db.MediaFiles.AddRangeAsync(
            new MediaFile
            {
                FileName = $"dashboard-image-{suffix}.jpg",
                OriginalFileName = "dashboard-image.jpg",
                FileType = "image",
                ContentType = "image/jpeg",
                FileSize = 10,
                RelativePath = $"uploads/images/dashboard-image-{suffix}.jpg",
                UploadedAt = now,
                IsDeleted = false
            },
            new MediaFile
            {
                FileName = $"dashboard-audio-{suffix}.mp3",
                OriginalFileName = "dashboard-audio.mp3",
                FileType = "audio",
                ContentType = "audio/mpeg",
                FileSize = 10,
                RelativePath = $"uploads/audio/dashboard-audio-{suffix}.mp3",
                UploadedAt = now,
                IsDeleted = false
            },
            new MediaFile
            {
                FileName = $"dashboard-deleted-{suffix}.jpg",
                OriginalFileName = "dashboard-deleted.jpg",
                FileType = "image",
                ContentType = "image/jpeg",
                FileSize = 10,
                RelativePath = $"uploads/images/dashboard-deleted-{suffix}.jpg",
                UploadedAt = now,
                IsDeleted = true
            });

        await db.NarrationLogs.AddRangeAsync(
            new NarrationLog
            {
                POIId = poi.Id,
                TriggerType = TriggerTypes.Qr,
                LanguageCode = "vi",
                PlayedAt = now,
                Synced = true
            },
            new NarrationLog
            {
                POIId = poi.Id,
                TriggerType = TriggerTypes.Manual,
                LanguageCode = "vi",
                PlayedAt = now,
                Synced = true
            });

        await db.SaveChangesAsync();
    }
}
