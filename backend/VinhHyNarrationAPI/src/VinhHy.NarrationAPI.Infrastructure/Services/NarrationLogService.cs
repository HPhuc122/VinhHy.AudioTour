using AutoMapper;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.NarrationLogs.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class NarrationLogService : INarrationLogService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public NarrationLogService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<NarrationLogDto> CreateAsync(
        CreateNarrationLogRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = await _uow.Pois.GetByIdAsync(request.POIId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), request.POIId);

        var log = _mapper.Map<NarrationLog>(request);
        log.Synced = true;

        await _uow.NarrationLogs.AddAsync(log, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<NarrationLogDto>(log);
    }

    public async Task<PagedResult<NarrationLogDto>> GetPagedAsync(
        NarrationLogListFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await _uow.NarrationLogs.GetPagedAsync(
            filter.Page,
            filter.PageSize,
            filter.POIId,
            filter.UserId,
            filter.DeviceId,
            filter.From,
            filter.To,
            cancellationToken).ConfigureAwait(false);

        return PagedResult<NarrationLogDto>.Create(
            _mapper.Map<IReadOnlyList<NarrationLogDto>>(items),
            filter.Page,
            filter.PageSize,
            total);
    }
}
