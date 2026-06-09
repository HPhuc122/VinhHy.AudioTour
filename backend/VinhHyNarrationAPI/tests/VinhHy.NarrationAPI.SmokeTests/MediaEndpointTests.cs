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

        var getImageResponse = await _client.GetAsync($"/api/v1/media/{imageId}");
        Assert.Equal(HttpStatusCode.OK, getImageResponse.StatusCode);
        Assert.Equal(imageId, await GetDataPropertyAsync<int>(getImageResponse, "id"));

        var deleteResponse = await _client.DeleteAsync($"/api/v1/media/{audioId}");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);

        var getDeletedResponse = await _client.GetAsync($"/api/v1/media/{audioId}");
        Assert.Equal(HttpStatusCode.NotFound, getDeletedResponse.StatusCode);
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
}
