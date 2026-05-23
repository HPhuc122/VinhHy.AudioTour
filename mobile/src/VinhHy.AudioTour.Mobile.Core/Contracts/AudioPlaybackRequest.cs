namespace VinhHy.AudioTour.Mobile.Core.Contracts;

public class AudioPlaybackRequest
{
    public int PoiId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string TriggerType { get; set; } = string.Empty;

    public string? LocalFilePath { get; set; }

    public string? RemoteFileUrl { get; set; }
}
