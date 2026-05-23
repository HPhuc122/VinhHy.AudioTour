namespace VinhHy.AudioTour.Mobile.Configuration;

public class ApiOptions
{
    public const string SectionName = "Api";

    public string BaseUrl { get; set; } = "https://localhost:7022";

    public int TimeoutSeconds { get; set; } = 30;
}
