using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPoiService
{
    Task<PoiDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<PoiDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<PagedResult<PoiDto>> GetPagedAsync(
        PoiListFilter filter,
        CancellationToken cancellationToken = default);

    Task<PagedResult<PoiDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? category = null,
        bool? isActive = null,
        ApprovalStatus? approvalStatus = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default);

    Task<PoiDto> CreateAsync(CreatePoiRequest request, CancellationToken cancellationToken = default);

    Task<PoiDto> UpdateAsync(int id, UpdatePoiRequest request, CancellationToken cancellationToken = default);

    Task<PoiDto> UpdateApprovalStatusAsync(
        int id,
        UpdatePoiApprovalStatusRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task RestoreAsync(int id, CancellationToken cancellationToken = default);
}
