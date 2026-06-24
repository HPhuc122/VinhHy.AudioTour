namespace VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;

public class StartAccessRequest
{
    public string QrCode { get; set; } = null!;

    public string? LanguageCode { get; set; }
}
