namespace VinhHy.AudioTour.Mobile.Core.Api.Sync;

public class SyncableLanguageDto
{
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string NativeName { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }
}
