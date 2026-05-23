namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncableLanguageDto
{
    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string NativeName { get; set; } = null!;

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }
}
