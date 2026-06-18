using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Features.Media.DTOs;

public class MediaListRequest : PaginationRequest
{
    public string? Search { get; set; }

    public string? FileType { get; set; }

    public string? ApprovalStatus { get; set; }

    public bool IncludeDeleted { get; set; }

    public int? UploadedByUserId { get; set; }
}
