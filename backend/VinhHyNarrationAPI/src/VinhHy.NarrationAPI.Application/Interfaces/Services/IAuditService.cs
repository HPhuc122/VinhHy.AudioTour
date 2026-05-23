using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.Audit.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IAuditService
{
    Task<PagedResult<AuditLogDto>> GetPagedAsync(
        AuditLogListFilter filter,
        CancellationToken cancellationToken = default);
}
