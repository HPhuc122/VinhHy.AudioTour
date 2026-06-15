namespace VinhHy.NarrationAPI.Application.Features.Languages.DTOs;

public class UpdateLanguageRequest
{
    public string Name { get; set; } = null!;

    public string NativeName { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}
