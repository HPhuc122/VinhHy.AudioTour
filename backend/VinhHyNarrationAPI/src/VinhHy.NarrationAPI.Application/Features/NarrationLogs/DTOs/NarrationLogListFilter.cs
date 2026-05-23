using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Features.NarrationLogs.DTOs;

public class NarrationLogListFilter : PaginationRequest
{
    public int? POIId { get; set; }

    public int? UserId { get; set; }

    public string? DeviceId { get; set; }

    public DateTime? From { get; set; }

    public DateTime? To { get; set; }
}
