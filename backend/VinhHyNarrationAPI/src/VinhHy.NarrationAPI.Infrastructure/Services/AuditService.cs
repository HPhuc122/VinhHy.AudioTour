using AutoMapper;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.Audit.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public AuditService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<PagedResult<AuditLogDto>> GetPagedAsync(
        AuditLogListFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await _uow.AuditLogs.GetPagedAsync(
            filter.Page,
            filter.PageSize,
            filter.TableName,
            filter.UserId,
            filter.From,
            filter.To,
            cancellationToken).ConfigureAwait(false);

        return PagedResult<AuditLogDto>.Create(
            _mapper.Map<IReadOnlyList<AuditLogDto>>(items),
            filter.Page,
            filter.PageSize,
            total);
    }
}
