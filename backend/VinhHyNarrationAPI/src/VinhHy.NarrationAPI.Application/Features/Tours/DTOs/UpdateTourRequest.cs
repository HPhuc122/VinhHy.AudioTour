namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class UpdateTourRequest
{
    public string? DefaultLanguage { get; set; }

    public bool? IsActive { get; set; }

    public int? EstimatedMinutes { get; set; }
}
