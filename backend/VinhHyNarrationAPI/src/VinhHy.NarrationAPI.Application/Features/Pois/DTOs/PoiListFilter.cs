using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class PoiListFilter : PaginationRequest
{
    public string? Search { get; set; }

    public string? Category { get; set; }

    public bool? IsActive { get; set; }

    public ApprovalStatus? ApprovalStatus { get; set; }

    public PoiLifecycleStatus? LifecycleStatus { get; set; }

    public bool IncludeDeleted { get; set; }
}
