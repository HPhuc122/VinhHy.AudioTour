using System.Net;
using System.Text.Json;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class LanguagesEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetLanguages_ReturnsSeededData()
    {
        var response = await _client.GetAsync("/api/v1/languages");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetProperty("success").GetBoolean());
        Assert.True(doc.RootElement.GetProperty("data").GetArrayLength() >= 1);
    }
}
