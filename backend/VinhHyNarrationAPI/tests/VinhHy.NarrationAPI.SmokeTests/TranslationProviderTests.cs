using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Infrastructure.Options;
using VinhHy.NarrationAPI.Infrastructure.Services;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

public class TranslationProviderTests
{
    [Fact]
    public async Task GoogleTranslateSelected_WithMissingConfig_ReturnsReadableError()
    {
        var provider = CreateGoogleTranslateProvider(new TranslationOptions
        {
            Provider = "GoogleTranslate",
            GoogleTranslate = new GoogleTranslateOptions
            {
                ApiKey = "",
                ApiKeyEnvironmentVariable = ""
            }
        });

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            provider.TranslateAsync("Xin chao", "vi", "en"));

        Assert.Equal("D\u1ecbch v\u1ee5 d\u1ecbch ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh", ex.Message);
        Assert.Equal(400, ex.StatusCode);
    }

    [Fact]
    public async Task GoogleTranslateSelected_WithMissingApiKey_ReturnsReadableError()
    {
        const string missingKeyEnvironmentVariable = "VINHHY_TRANSLATION_TEST_MISSING_KEY";
        Environment.SetEnvironmentVariable(missingKeyEnvironmentVariable, null);

        var provider = CreateGoogleTranslateProvider(new TranslationOptions
        {
            Provider = "GoogleTranslate",
            GoogleTranslate = new GoogleTranslateOptions
            {
                ApiKey = "",
                ApiKeyEnvironmentVariable = missingKeyEnvironmentVariable
            }
        });

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            provider.TranslateAsync("Xin chao", "vi", "en"));

        Assert.Equal("Ch\u01b0a c\u1ea5u h\u00ecnh API key cho d\u1ecbch v\u1ee5 d\u1ecbch", ex.Message);
        Assert.Equal(400, ex.StatusCode);
    }

    [Fact]
    public async Task GoogleTranslateProvider_WithNonSuccessResponse_ReturnsSafeError()
    {
        var provider = CreateGoogleTranslateProvider(
            ValidGoogleTranslateOptions(),
            new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent("{\"error\":\"secret provider details\"}")
            });

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            provider.TranslateAsync("Xin chao", "vi", "en"));

        Assert.Equal("D\u1ecbch v\u1ee5 d\u1ecbch \u0111ang l\u1ed7i ho\u1eb7c kh\u00f4ng ph\u1ea3n h\u1ed3i", ex.Message);
        Assert.Equal(502, ex.StatusCode);
    }

    [Fact]
    public async Task GoogleTranslateProvider_WithBlockedApiKey_ReturnsActionableError()
    {
        var provider = CreateGoogleTranslateProvider(
            ValidGoogleTranslateOptions(),
            new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent("""
                {
                  "error": {
                    "details": [
                      {
                        "reason": "API_KEY_SERVICE_BLOCKED"
                      }
                    ]
                  }
                }
                """)
            });

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            provider.TranslateAsync("Xin chao", "vi", "en"));

        Assert.Equal(
            "API key \u0111ang b\u1ecb ch\u1eb7n kh\u1ecfi Cloud Translation API. H\u00e3y cho ph\u00e9p Cloud Translation API trong API restrictions c\u1ee7a key.",
            ex.Message);
        Assert.Equal(400, ex.StatusCode);
    }

    [Fact]
    public async Task GoogleTranslateProvider_WithInvalidResponse_ReturnsReadableError()
    {
        var provider = CreateGoogleTranslateProvider(
            ValidGoogleTranslateOptions(),
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{not-json")
            });

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            provider.TranslateAsync("Xin chao", "vi", "en"));

        Assert.Equal("D\u1ecbch v\u1ee5 d\u1ecbch tr\u1ea3 v\u1ec1 d\u1eef li\u1ec7u kh\u00f4ng h\u1ee3p l\u1ec7", ex.Message);
        Assert.Equal(502, ex.StatusCode);
    }

    [Fact]
    public async Task GoogleTranslateProvider_ParsesGoogleTranslateResponse()
    {
        var provider = CreateGoogleTranslateProvider(
            ValidGoogleTranslateOptions(),
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""
                {
                  "data": {
                    "translations": [
                      {
                        "translatedText": "Hello &amp; welcome"
                      }
                    ]
                  }
                }
                """)
            });

        var result = await provider.TranslateAsync("Xin chao", "vi", "en");

        Assert.Equal("Hello & welcome", result);
    }

    [Fact]
    public void GoogleTranslateProvider_ReportsConfiguredWhenApiKeyExists()
    {
        var config = new GoogleTranslateOptions
        {
            ApiKey = "test-key",
            ApiKeyEnvironmentVariable = ""
        };

        Assert.True(GoogleTranslateProvider.IsConfigured(config));
    }

    [Fact]
    public async Task SimulatedProvider_StillWorks()
    {
        var provider = new SimulatedTranslationProvider();

        var result = await provider.TranslateAsync("Xin chao", "vi", "en");

        Assert.Equal("[en] Xin chao", result);
    }

    private static TranslationOptions ValidGoogleTranslateOptions() => new()
    {
        Provider = "GoogleTranslate",
        GoogleTranslate = new GoogleTranslateOptions
        {
            ApiKey = "test-key",
            ApiKeyEnvironmentVariable = ""
        }
    };

    private static GoogleTranslateProvider CreateGoogleTranslateProvider(
        TranslationOptions options,
        HttpResponseMessage? response = null)
    {
        var client = new HttpClient(new StubHttpMessageHandler(response ?? new HttpResponseMessage(HttpStatusCode.OK)));

        return new GoogleTranslateProvider(
            client,
            Options.Create(options),
            NullLogger<GoogleTranslateProvider>.Instance);
    }

    private sealed class StubHttpMessageHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(response);
    }
}
