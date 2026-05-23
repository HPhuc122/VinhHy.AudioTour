using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Features.Audit.DTOs;

public class AuditLogListFilter : PaginationRequest
{
    public string? TableName { get; set; }

    public int? UserId { get; set; }

    public DateTime? From { get; set; }

    public DateTime? To { get; set; }
}
