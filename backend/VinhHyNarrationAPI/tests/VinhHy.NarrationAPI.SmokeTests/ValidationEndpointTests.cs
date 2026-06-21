using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
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
    public async Task GenerateNarrationTranslations_AsAdmin_CreatesApprovedTargetNarration()
    {
        await AuthenticateAdminAsync();
        var poiId = await CreatePoiAsync();

        var sourceResponse = await _client.PostAsJsonAsync(
            "/api/v1/narrations",
            new CreateNarrationDraftRequest
            {
                PoiId = poiId,
                Title = "Vietnamese narration",
                LanguageCode = "vi",
                TextContent = "This narration text is long enough for translation.",
                Voice = "female-south"
            });
        Assert.Equal(HttpStatusCode.OK, sourceResponse.StatusCode);

        using var sourceDoc = JsonDocument.Parse(await sourceResponse.Content.ReadAsStringAsync());
        var sourceId = sourceDoc.RootElement.GetProperty("data").GetProperty("id").GetInt32();

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/narrations/{sourceId}/translations",
            new GenerateNarrationTranslationsRequest
            {
                TargetLanguageCodes = ["en"],
                OverwriteExisting = false
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var responseDoc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var narrations = responseDoc.RootElement.GetProperty("data").GetProperty("narrations");
        Assert.Equal(1, narrations.GetArrayLength());
        Assert.Equal("en", narrations[0].GetProperty("languageCode").GetString());
        Assert.Equal("Approved", narrations[0].GetProperty("status").GetString());
        Assert.StartsWith("[en]", narrations[0].GetProperty("title").GetString());
        Assert.StartsWith("[en]", narrations[0].GetProperty("textContent").GetString());
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

    [Fact]
    public async Task GeneratePoiTranslations_AsAdmin_CreatesTargetTranslation()
    {
        await AuthenticateAdminAsync();
        var poiId = await CreatePoiAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/poi-translations/generate",
            new GeneratePoiTranslationsRequest
            {
                PoiId = poiId,
                SourceLanguageCode = "vi",
                TargetLanguageCodes = ["en"],
                OverwriteExisting = false
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var translations = doc.RootElement.GetProperty("data").GetProperty("translations");
        Assert.Equal(1, translations.GetArrayLength());
        Assert.Equal("en", translations[0].GetProperty("languageCode").GetString());
        Assert.StartsWith("[en]", translations[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task GeneratePoiTranslations_WithGoogleProviderMissingConfig_ReturnsReadableError()
    {
        using var googleProviderFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Translation:Provider"] = "GoogleTranslate",
                    ["Translation:GoogleTranslate:ApiKey"] = "",
                    ["Translation:GoogleTranslate:ApiKeyEnvironmentVariable"] = ""
                });
            });
        });
        using var client = googleProviderFactory.CreateClient();

        await AuthenticateAdminAsync(client);
        var poiId = await CreatePoiAsync(client);

        var providerResponse = await client.GetAsync("/api/v1/poi-translations/provider");
        Assert.Equal(HttpStatusCode.OK, providerResponse.StatusCode);
        using (var providerDoc = JsonDocument.Parse(await providerResponse.Content.ReadAsStringAsync()))
        {
            var provider = providerDoc.RootElement.GetProperty("data");
            Assert.Equal("GoogleTranslate", provider.GetProperty("provider").GetString());
            Assert.False(provider.GetProperty("isConfigured").GetBoolean());
            Assert.False(provider.GetProperty("isSimulated").GetBoolean());
        }

        var response = await client.PostAsJsonAsync(
            "/api/v1/poi-translations/generate",
            new GeneratePoiTranslationsRequest
            {
                PoiId = poiId,
                SourceLanguageCode = "vi",
                TargetLanguageCodes = ["en"],
                OverwriteExisting = false
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(
            "D\u1ecbch v\u1ee5 d\u1ecbch ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh",
            doc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task GeneratePoiTranslations_AsVendor_AllowsOwnPoiAndForbidsOtherPoi()
    {
        await AuthenticateVendorAsync();
        var ownPoiId = await CreatePoiAsync();

        var ownResponse = await _client.PostAsJsonAsync(
            "/api/v1/poi-translations/generate",
            new GeneratePoiTranslationsRequest
            {
                PoiId = ownPoiId,
                SourceLanguageCode = "vi",
                TargetLanguageCodes = ["en"],
                OverwriteExisting = false
            });

        Assert.Equal(HttpStatusCode.OK, ownResponse.StatusCode);

        await AuthenticateAdminAsync();
        var otherPoiId = await CreatePoiAsync();

        await AuthenticateVendorAsync();
        var forbiddenResponse = await _client.PostAsJsonAsync(
            "/api/v1/poi-translations/generate",
            new GeneratePoiTranslationsRequest
            {
                PoiId = otherPoiId,
                SourceLanguageCode = "vi",
                TargetLanguageCodes = ["en"],
                OverwriteExisting = false
            });

        Assert.Equal(HttpStatusCode.Forbidden, forbiddenResponse.StatusCode);
    }

    [Fact]
    public async Task GeneratePoiTranslations_ExistingTarget_RespectsOverwriteFlag()
    {
        await AuthenticateAdminAsync();
        var poiId = await CreatePoiAsync();

        var existing = new CreatePoiTranslationRequest
        {
            POIId = poiId,
            LanguageCode = "en",
            Name = "Manual English POI",
            ShortDescription = "Manual short description",
            Description = "Manual full description"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/poi-translations", existing);
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var skipResponse = await _client.PostAsJsonAsync(
            "/api/v1/poi-translations/generate",
            new GeneratePoiTranslationsRequest
            {
                PoiId = poiId,
                SourceLanguageCode = "vi",
                TargetLanguageCodes = ["en"],
                OverwriteExisting = false
            });

        Assert.Equal(HttpStatusCode.OK, skipResponse.StatusCode);
        using (var skipDoc = JsonDocument.Parse(await skipResponse.Content.ReadAsStringAsync()))
        {
            var data = skipDoc.RootElement.GetProperty("data");
            Assert.Equal(0, data.GetProperty("translations").GetArrayLength());
            Assert.Contains(
                data.GetProperty("skippedLanguageCodes").EnumerateArray(),
                item => item.GetString() == "en");
        }

        var overwriteResponse = await _client.PostAsJsonAsync(
            "/api/v1/poi-translations/generate",
            new GeneratePoiTranslationsRequest
            {
                PoiId = poiId,
                SourceLanguageCode = "vi",
                TargetLanguageCodes = ["en"],
                OverwriteExisting = true
            });

        Assert.Equal(HttpStatusCode.OK, overwriteResponse.StatusCode);
        using var overwriteDoc = JsonDocument.Parse(await overwriteResponse.Content.ReadAsStringAsync());
        var translations = overwriteDoc.RootElement.GetProperty("data").GetProperty("translations");
        Assert.Equal(1, translations.GetArrayLength());
        Assert.StartsWith("[en]", translations[0].GetProperty("name").GetString());
    }

    private static MultipartFormDataContent BuildValidPoiForm(string latitude = "11.750000")
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent("Validation smoke POI"), "Name" },
            { new StringContent("Validation smoke short description"), "ShortDescription" },
            { new StringContent("Validation smoke full description"), "Description" },
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

    private Task<int> CreatePoiAsync() => CreatePoiAsync(_client);

    private static async Task<int> CreatePoiAsync(HttpClient client)
    {
        using var form = BuildValidPoiForm();
        var response = await client.PostAsync("/api/v1/pois", form);

        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty("id").GetInt32();
    }

    private Task AuthenticateAdminAsync() => AuthenticateAdminAsync(_client);

    private static async Task AuthenticateAdminAsync(HttpClient client)
    {
        var loginResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "ChangeMe123!" });

        loginResponse.EnsureSuccessStatusCode();
        client.DefaultRequestHeaders.Authorization =
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
