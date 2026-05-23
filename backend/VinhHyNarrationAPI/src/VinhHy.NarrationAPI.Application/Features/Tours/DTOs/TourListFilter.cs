using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class TourListFilter : PaginationRequest
{
    public string? Search { get; set; }

    public bool? IsActive { get; set; }

    public bool IncludeDeleted { get; set; }
}
