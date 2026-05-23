using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class PoiListFilter : PaginationRequest
{
    public string? Search { get; set; }

    public string? Category { get; set; }

    public bool? IsActive { get; set; }

    public bool IncludeDeleted { get; set; }
}
