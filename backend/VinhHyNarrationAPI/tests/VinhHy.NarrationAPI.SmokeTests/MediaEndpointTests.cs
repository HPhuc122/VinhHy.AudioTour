using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class MediaEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task MediaEndpoints_SupportUploadGetAndDelete()
    {
        await AuthenticateAsync();

        var imageResponse = await UploadAsync("vinh-hy.jpg", "image/jpeg", [0xFF, 0xD8, 0xFF, 0xD9]);
        Assert.Equal(HttpStatusCode.OK, imageResponse.StatusCode);
        var imageId = await GetDataPropertyAsync<int>(imageResponse, "id");
        Assert.Equal("image", await GetDataPropertyAsync<string>(imageResponse, "fileType"));
        Assert.Equal("vinh-hy.jpg", await GetDataPropertyAsync<string>(imageResponse, "originalFileName"));

        var audioResponse = await UploadAsync("narration.mp3", "audio/mpeg", [0x49, 0x44, 0x33, 0x04]);
        Assert.Equal(HttpStatusCode.OK, audioResponse.StatusCode);
        var audioId = await GetDataPropertyAsync<int>(audioResponse, "id");
        Assert.Equal("audio", await GetDataPropertyAsync<string>(audioResponse, "fileType"));

        var listResponse = await _client.GetAsync("/api/v1/media");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var searchResponse = await _client.GetAsync("/api/v1/media/search?page=1&pageSize=10&search=vinh&fileType=image");
        Assert.Equal(HttpStatusCode.OK, searchResponse.StatusCode);
        Assert.Equal(1, await GetDataPropertyAsync<int>(searchResponse, "totalCount"));
        Assert.Equal("image", await GetFirstItemPropertyAsync<string>(searchResponse, "fileType"));
        Assert.False(string.IsNullOrWhiteSpace(await GetFirstItemPropertyAsync<string>(searchResponse, "publicUrl")));

        var getImageResponse = await _client.GetAsync($"/api/v1/media/{imageId}");
        Assert.Equal(HttpStatusCode.OK, getImageResponse.StatusCode);
        Assert.Equal(imageId, await GetDataPropertyAsync<int>(getImageResponse, "id"));

        var deleteResponse = await _client.DeleteAsync($"/api/v1/media/{audioId}");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);

        var getDeletedResponse = await _client.GetAsync($"/api/v1/media/{audioId}");
        Assert.Equal(HttpStatusCode.NotFound, getDeletedResponse.StatusCode);

        var deletedSearchResponse = await _client.GetAsync("/api/v1/media/search?page=1&pageSize=10&fileType=audio&includeDeleted=true");
        Assert.Equal(HttpStatusCode.OK, deletedSearchResponse.StatusCode);
        Assert.True(await GetFirstItemPropertyAsync<bool>(deletedSearchResponse, "isDeleted"));

        var restoreResponse = await _client.PostAsync($"/api/v1/media/{audioId}/restore", null);
        Assert.Equal(HttpStatusCode.OK, restoreResponse.StatusCode);

        var restoredResponse = await _client.GetAsync($"/api/v1/media/{audioId}");
        Assert.Equal(HttpStatusCode.OK, restoredResponse.StatusCode);
        Assert.False(await GetDataPropertyAsync<bool>(restoredResponse, "isDeleted"));
    }

    [Fact]
    public async Task UploadMedia_WithOversizedImage_ReturnsBadRequest()
    {
        await AuthenticateAsync();

        var oversizedImage = new byte[(5 * 1024 * 1024) + 1];
        var response = await UploadAsync("oversized.jpg", "image/jpeg", oversizedImage);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CmsPoiAssetStream_StreamsLegacyPoiUploadFromWwwroot()
    {
        await AuthenticateAsync();

        using var form = BuildPoiFormWithImage();
        var createResponse = await _client.PostAsync("/api/v1/pois", form);

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        using var doc = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var data = doc.RootElement.GetProperty("data");
        var poiId = data.GetProperty("id").GetInt32();
        var imageUrl = data.GetProperty("imageUrl").GetString()
            ?? throw new InvalidOperationException("POI response did not include imageUrl.");

        var streamResponse = await _client.GetAsync(
            $"/api/v1/cms/media/poi-assets/stream?poiId={poiId}&relativePath={Uri.EscapeDataString(imageUrl)}");

        Assert.Equal(HttpStatusCode.OK, streamResponse.StatusCode);
        Assert.Equal("image/jpeg", streamResponse.Content.Headers.ContentType?.MediaType);
    }

    private async Task<HttpResponseMessage> UploadAsync(
        string fileName,
        string contentType,
        byte[] bytes)
    {
        using var form = new MultipartFormDataContent();
        using var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(fileContent, "file", fileName);

        return await _client.PostAsync("/api/v1/media/upload", form);
    }

    private static MultipartFormDataContent BuildPoiFormWithImage()
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent($"CMS legacy image POI {Guid.NewGuid():N}"), "Name" },
            { new StringContent("POI image stream smoke test"), "ShortDescription" },
            { new StringContent("POI image stream smoke test description"), "Description" },
            { new StringContent("11.750000"), "Latitude" },
            { new StringContent("109.180000"), "Longitude" },
            { new StringContent("30"), "RadiusMeters" },
            { new StringContent("1"), "Priority" },
            { new StringContent("smoke-test"), "Category" },
            { new StringContent("300"), "CooldownSeconds" },
            { new StringContent("5"), "MinDwellSeconds" }
        };

        var fileContent = new ByteArrayContent([0xFF, 0xD8, 0xFF, 0xD9]);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(fileContent, "Image", "legacy-poi.jpg");

        return form;
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

    private static async Task<T> GetDataPropertyAsync<T>(HttpResponseMessage response, string propertyName)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty(propertyName).Deserialize<T>()!;
    }

    private static async Task<T> GetFirstItemPropertyAsync<T>(HttpResponseMessage response, string propertyName)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data")
            .GetProperty("items")[0]
            .GetProperty(propertyName)
            .Deserialize<T>()!;
    }
}
