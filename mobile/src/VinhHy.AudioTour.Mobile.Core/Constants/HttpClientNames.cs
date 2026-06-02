namespace VinhHy.AudioTour.Mobile.Core.Constants;

public static class HttpClientNames
{
    /// <summary>API client with authentication handler and Polly retries.</summary>
    public const string Api = "VinhHy.Api";

    /// <summary>Plain client for login/refresh (no bearer header).</summary>
    public const string Auth = "VinhHy.Auth";
}
