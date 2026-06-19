using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Domain.Entities;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class ValidationEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreatePoi_WithInvalidCoordinates_ReturnsBadRequest()
    {
        await AuthenticateAdminAsync();

        using var form = BuildValidPoiForm(latitude: "91");

        var response = await _client.PostAsync("/api/v1/pois", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreatePoi_AsVendorWithManualOwner_ReturnsBadRequest()
    {
        await AuthenticateVendorAsync();

        using var form = BuildValidPoiForm();
        form.Add(new StringContent("1"), "UserId");

        var response = await _client.PostAsync("/api/v1/pois", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateNarration_WithoutPoiId_ReturnsBadRequest()
    {
        await AuthenticateAdminAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/narrations",
            new CreateNarrationDraftRequest
            {
                PoiId = 0,
                Title = "Valid narration title",
                LanguageCode = "vi",
                TextContent = "This narration text is long enough.",
                Voice = "vi-female"
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateNarration_DuplicatePoiLanguage_ReturnsBadRequest()
    {
        await AuthenticateAdminAsync();
        var poiId = await CreatePoiAsync();

        var request = new CreateNarrationDraftRequest
        {
            PoiId = poiId,
            Title = "Vietnamese narration",
            LanguageCode = "vi",
            TextContent = "This narration text is long enough.",
            Voice = "vi-female"
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/narrations", request);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        var duplicateResponse = await _client.PostAsJsonAsync("/api/v1/narrations", request);
        Assert.Equal(HttpStatusCode.BadRequest, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task CreatePoiTranslation_DuplicatePoiLanguage_ReturnsBadRequest()
    {
        await AuthenticateAdminAsync();
        var poiId = await CreatePoiAsync();

        var request = new CreatePoiTranslationRequest
        {
            POIId = poiId,
            LanguageCode = "en",
            Name = "English POI",
            ShortDescription = "Short English description",
            Description = "Full English description"
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/poi-translations", request);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        var duplicateResponse = await _client.PostAsJsonAsync("/api/v1/poi-translations", request);
        Assert.Equal(HttpStatusCode.BadRequest, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task CreatePoiTranslation_AsVendorForOtherPoi_ReturnsForbidden()
    {
        await AuthenticateAdminAsync();
        var poiId = await CreatePoiAsync();

        await AuthenticateVendorAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/poi-translations",
            new CreatePoiTranslationRequest
            {
                POIId = poiId,
                LanguageCode = "en",
                Name = "Vendor translation",
                ShortDescription = "Vendor should not be able to edit this POI",
                Description = "Vendor should not be able to edit this POI"
            });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static MultipartFormDataContent BuildValidPoiForm(string latitude = "11.750000")
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent("Validation smoke POI"), "Name" },
            { new StringContent(latitude), "Latitude" },
            { new StringContent("109.180000"), "Longitude" },
            { new StringContent("30"), "RadiusMeters" },
            { new StringContent("1"), "Priority" },
            { new StringContent("smoke-test"), "Category" },
            { new StringContent("300"), "CooldownSeconds" },
            { new StringContent("5"), "MinDwellSeconds" },
            { new StringContent(ApprovalStatus.Pending.ToString()), "ApprovalStatus" }
        };

        return form;
    }

    private async Task<int> CreatePoiAsync()
    {
        using var form = BuildValidPoiForm();
        var response = await _client.PostAsync("/api/v1/pois", form);

        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty("id").GetInt32();
    }

    private async Task AuthenticateAdminAsync()
    {
        var loginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "ChangeMe123!" });

        loginResponse.EnsureSuccessStatusCode();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await ReadAccessTokenAsync(loginResponse));
    }

    private async Task AuthenticateVendorAsync()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var suffix = Guid.NewGuid().ToString("N");
        var username = $"validator-vendor-{suffix}";
        var password = "ChangeMe123!";

        var registerResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest
            {
                Username = username,
                Email = $"{username}@example.com",
                Password = password,
                ConfirmPassword = password,
                OwnerName = "Validation owner",
                StoreName = "Validation stall",
                PhoneNumber = "0900000000",
                PreferredLanguage = "vi"
            });

        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var loginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = username, Password = password });

        loginResponse.EnsureSuccessStatusCode();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await ReadAccessTokenAsync(loginResponse));
    }

    private static async Task<string> ReadAccessTokenAsync(HttpResponseMessage response)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty("accessToken").GetString()
            ?? throw new InvalidOperationException("Login response did not include an access token.");
    }
}
