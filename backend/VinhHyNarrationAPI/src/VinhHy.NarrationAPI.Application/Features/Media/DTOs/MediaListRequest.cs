using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Features.Media.DTOs;

public class MediaListRequest : PaginationRequest
{
    public string? Search { get; set; }

    public string? FileType { get; set; }

    public bool IncludeDeleted { get; set; }
}
