using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.NarrationLogs.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface INarrationLogService
{
    Task<NarrationLogDto> CreateAsync(CreateNarrationLogRequest request, CancellationToken cancellationToken = default);

    Task<PagedResult<NarrationLogDto>> GetPagedAsync(
        NarrationLogListFilter filter,
        CancellationToken cancellationToken = default);
}
