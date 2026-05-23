using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class QrService : IQrService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly SoftDeleteService _softDelete;

    public QrService(IUnitOfWork uow, IMapper mapper, SoftDeleteService softDelete)
    {
        _uow = uow;
        _mapper = mapper;
        _softDelete = softDelete;
    }

    public async Task<QrLocationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return qr is null ? null : _mapper.Map<QrLocationDto>(qr);
    }

    public async Task<QrResolveResponse?> ResolveAsync(string qrCode, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByQrCodeAsync(qrCode, cancellationToken).ConfigureAwait(false);
        if (qr is null || qr.ExpiresAt is not null && qr.ExpiresAt <= DateTime.UtcNow)
            return null;

        return new QrResolveResponse
        {
            QrLocation = _mapper.Map<QrLocationDto>(qr),
            Poi = _mapper.Map<PoiDto>(qr.Poi)
        };
    }

    public async Task<IReadOnlyList<QrLocationDto>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default)
    {
        var items = await _uow.QrLocations.GetByPoiIdAsync(poiId, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<QrLocationDto>>(items);
    }

    public async Task<QrLocationDto> CreateAsync(
        CreateQrLocationRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = await _uow.Pois.GetByIdAsync(request.POIId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), request.POIId);

        if (await _uow.QrLocations.GetByQrCodeAsync(request.QRCode, cancellationToken).ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.QRCode), "QR code already exists.");

        var qr = _mapper.Map<QrLocation>(request);
        qr.CreatedAt = DateTime.UtcNow;

        await _uow.QrLocations.AddAsync(qr, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<QrLocationDto>(qr);
    }

    public async Task<QrLocationDto> UpdateAsync(
        int id,
        UpdateQrLocationRequest request,
        CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(QrLocation), id);

        if (request.Label is not null) qr.Label = request.Label;
        if (request.IsActive.HasValue) qr.IsActive = request.IsActive.Value;
        if (request.ExpiresAt.HasValue) qr.ExpiresAt = request.ExpiresAt;

        _uow.QrLocations.Update(qr);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<QrLocationDto>(qr);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(QrLocation), id);

        await _softDelete.SoftDeleteAsync(qr, SyncEntityTypes.QRLocation, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        _uow.QrLocations.SoftDelete(qr);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
