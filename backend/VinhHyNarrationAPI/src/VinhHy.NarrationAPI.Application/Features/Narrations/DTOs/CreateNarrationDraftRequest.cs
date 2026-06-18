namespace VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

public class CreateNarrationDraftRequest
{
    public string Title { get; set; } = null!;

    public string LanguageCode { get; set; } = "vi";

    public string TextContent { get; set; } = null!;

    public string Voice { get; set; } = null!;
}
