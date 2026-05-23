namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class CreateTourRequest
{
    public string Code { get; set; } = null!;

    public string DefaultLanguage { get; set; } = "vi";

    public bool IsActive { get; set; } = true;

    public int? EstimatedMinutes { get; set; }
}
