using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

public class NarrationDraftListRequest : PaginationRequest
{
    public string? Status { get; set; }

    public string? Search { get; set; }

    public int? SubmittedByUserId { get; set; }
}
