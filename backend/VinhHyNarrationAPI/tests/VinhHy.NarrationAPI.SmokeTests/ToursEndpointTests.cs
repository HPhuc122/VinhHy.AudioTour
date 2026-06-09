using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class ToursEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task TourEndpoints_SupportCrudTranslationsPoisAndReorder()
    {
        await AuthenticateAsync();
        var poiId = await SeedPoiAsync();
        var code = $"TOUR-{Guid.NewGuid():N}";

        var createResponse = await _client.PostAsJsonAsync(
            "/api/v1/tours",
            new CreateTourRequest
            {
                Code = code,
                DefaultLanguage = "vi",
                EstimatedMinutes = 45,
                IsActive = true
            });

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var createdTourId = await GetDataPropertyAsync<int>(createResponse, "id");

        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/v1/tours/{createdTourId}",
            new UpdateTourRequest
            {
                EstimatedMinutes = 60
            });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var translationResponse = await _client.PostAsJsonAsync(
            $"/api/v1/tours/{createdTourId}/translations",
            new CreateTourTranslationRequest
            {
                LanguageCode = "vi",
                Name = "Tour Vinh Hy",
                Description = "Tour route description"
            });

        Assert.Equal(HttpStatusCode.OK, translationResponse.StatusCode);
        var translationId = await GetDataPropertyAsync<int>(translationResponse, "id");

        var updateTranslationResponse = await _client.PutAsJsonAsync(
            $"/api/v1/tours/translations/{translationId}",
            new UpdateTourTranslationRequest
            {
                Name = "Updated Tour Vinh Hy"
            });

        Assert.Equal(HttpStatusCode.OK, updateTranslationResponse.StatusCode);

        var addPoiResponse = await _client.PostAsJsonAsync(
            $"/api/v1/tours/{createdTourId}/pois",
            new AddTourPoiRequest
            {
                POIId = poiId,
                OrderIndex = 1
            });

        Assert.Equal(HttpStatusCode.OK, addPoiResponse.StatusCode);

        var reorderResponse = await _client.PutAsJsonAsync(
            $"/api/v1/tours/{createdTourId}/pois/reorder",
            new ReorderTourPoisRequest
            {
                Items =
                [
                    new TourPoiOrderItem
                    {
                        POIId = poiId,
                        OrderIndex = 2
                    }
                ]
            });

        Assert.Equal(HttpStatusCode.OK, reorderResponse.StatusCode);

        var listResponse = await _client.GetAsync($"/api/v1/tours?search={code}");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        using (var listDoc = JsonDocument.Parse(await listResponse.Content.ReadAsStringAsync()))
        {
            var items = listDoc.RootElement.GetProperty("data").GetProperty("items");
            Assert.Single(items.EnumerateArray());
            Assert.Equal("Updated Tour Vinh Hy", items[0].GetProperty("translations")[0].GetProperty("name").GetString());
            Assert.Equal("POI-SMOKE", items[0].GetProperty("pois")[0].GetProperty("poiCode").GetString());
            Assert.Equal(2, items[0].GetProperty("pois")[0].GetProperty("orderIndex").GetInt32());
        }

        var detailResponse = await _client.GetAsync($"/api/v1/tours/{createdTourId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);

        var removePoiResponse = await _client.DeleteAsync($"/api/v1/tours/{createdTourId}/pois/{poiId}");
        Assert.Equal(HttpStatusCode.OK, removePoiResponse.StatusCode);

        var deleteResponse = await _client.DeleteAsync($"/api/v1/tours/{createdTourId}");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);

        var getDeletedResponse = await _client.GetAsync($"/api/v1/tours/{createdTourId}");
        Assert.Equal(HttpStatusCode.NotFound, getDeletedResponse.StatusCode);
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

    private async Task<int> SeedPoiAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var existing = db.Pois.FirstOrDefault(p => p.Code == "POI-SMOKE");
        if (existing is not null)
        {
            return existing.Id;
        }

        var now = DateTime.UtcNow;
        var poi = new Poi
        {
            Code = "POI-SMOKE",
            Latitude = 11.750000m,
            Longitude = 109.180000m,
            RadiusMeters = 30,
            Priority = 1,
            IsActive = true,
            Category = "smoke-test",
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.Pois.AddAsync(poi);
        await db.SaveChangesAsync();

        return poi.Id;
    }

    private static async Task<T> GetDataPropertyAsync<T>(HttpResponseMessage response, string propertyName)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty(propertyName).Deserialize<T>()!;
    }
}
