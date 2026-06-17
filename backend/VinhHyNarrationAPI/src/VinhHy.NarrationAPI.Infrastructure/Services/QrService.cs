using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;
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

    public async Task<IReadOnlyList<QrDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var items = await _uow.QrLocations.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<QrDto>>(items);
    }

    public async Task<QrDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return qr is null ? null : _mapper.Map<QrDto>(qr);
    }

    public async Task<QrDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations
            .GetByCodeAsync(code, activeOnly: true, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return qr is null ? null : _mapper.Map<QrDto>(qr);
    }

    public async Task<QrResolveResponse?> ResolveAsync(string code, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations
            .GetByCodeAsync(code, activeOnly: true, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        if (qr is null)
        {
            return null;
        }

        return new QrResolveResponse
        {
            Qr = _mapper.Map<QrDto>(qr),
            Poi = qr.Poi is null ? null : _mapper.Map<PoiDto>(qr.Poi),
            Tour = qr.Tour is null ? null : _mapper.Map<TourDto>(qr.Tour)
        };
    }

    public async Task<QrDto> CreateAsync(CreateQrRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateTargetAsync(request.PoiId, request.TourId, cancellationToken).ConfigureAwait(false);

        var now = DateTime.UtcNow;
        var qr = _mapper.Map<QrLocation>(request);
        ApplyPaymentConfig(qr, request.RequiresPayment, request.PriceAmount, request.AccessDurationMinutes);
        qr.Code = await GenerateUniqueCodeAsync(request.PoiId.HasValue ? "POI" : "TOUR", cancellationToken)
            .ConfigureAwait(false);
        qr.CreatedAt = now;
        qr.UpdatedAt = now;

        await _uow.QrLocations.AddAsync(qr, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var saved = await _uow.QrLocations.GetByIdAsync(qr.Id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return _mapper.Map<QrDto>(saved!);
    }

    public async Task<QrDto> UpdateAsync(
        int id,
        UpdateQrRequest request,
        CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(QrLocation), id);

        if (request.Code is not null && request.Code != qr.Code)
        {
            ValidateCode(request.Code);

            if (await _uow.QrLocations
                    .GetByCodeAsync(request.Code, includeDeleted: true, cancellationToken: cancellationToken)
                    .ConfigureAwait(false) is not null)
            {
                throw new ValidationException(nameof(request.Code), "QR code already exists.");
            }

            qr.Code = request.Code;
        }

        if (request.PoiId.HasValue || request.TourId.HasValue)
        {
            await ValidateTargetAsync(request.PoiId, request.TourId, cancellationToken).ConfigureAwait(false);
            qr.PoiId = request.PoiId;
            qr.TourId = request.TourId;
        }

        if (request.IsActive.HasValue)
        {
            qr.IsActive = request.IsActive.Value;
        }

        ApplyPaymentConfig(qr, request.RequiresPayment, request.PriceAmount, request.AccessDurationMinutes);

        qr.UpdatedAt = DateTime.UtcNow;

        _uow.QrLocations.Update(qr);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var saved = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return _mapper.Map<QrDto>(saved!);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(QrLocation), id);

        await _softDelete.SoftDeleteAsync(qr, SyncEntityTypes.QRLocation, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        qr.UpdatedAt = DateTime.UtcNow;
        _uow.QrLocations.SoftDelete(qr);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task ValidateTargetAsync(int? poiId, int? tourId, CancellationToken cancellationToken)
    {
        if (!poiId.HasValue && !tourId.HasValue)
        {
            throw new ValidationException(nameof(CreateQrRequest.PoiId), "Either PoiId or TourId must be provided.");
        }

        if (poiId.HasValue && tourId.HasValue)
        {
            throw new ValidationException(nameof(CreateQrRequest.TourId), "QR code can target either a POI or a tour, not both.");
        }

        if (poiId.HasValue)
        {
            _ = await _uow.Pois.GetByIdAsync(poiId.Value, cancellationToken: cancellationToken).ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Poi), poiId.Value);
        }

        if (tourId.HasValue)
        {
            _ = await _uow.Tours.GetByIdAsync(tourId.Value, cancellationToken: cancellationToken).ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Tour), tourId.Value);
        }
    }

    private static void ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ValidationException(nameof(CreateQrRequest.Code), "QR code is required.");
        }
    }

    private static void ApplyPaymentConfig(
        QrLocation qr,
        bool? requiresPayment,
        decimal? priceAmount,
        int? accessDurationMinutes)
    {
        if (requiresPayment.HasValue)
        {
            qr.RequiresPayment = requiresPayment.Value;
        }

        if (priceAmount.HasValue)
        {
            if (priceAmount.Value < 0)
            {
                throw new ValidationException(nameof(UpdateQrRequest.PriceAmount), "Price amount cannot be negative.");
            }

            qr.PriceAmount = priceAmount.Value;
        }

        if (accessDurationMinutes.HasValue)
        {
            if (accessDurationMinutes.Value <= 0)
            {
                throw new ValidationException(
                    nameof(UpdateQrRequest.AccessDurationMinutes),
                    "Access duration must be greater than 0.");
            }

            qr.AccessDurationMinutes = accessDurationMinutes.Value;
        }
    }

    private async Task<string> GenerateUniqueCodeAsync(string prefix, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            var code = $"{prefix}-{suffix}";
            var existing = await _uow.QrLocations
                .GetByCodeAsync(code, includeDeleted: true, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (existing is null)
            {
                return code;
            }
        }

        throw new ValidationException(nameof(CreateQrRequest.Code), "Unable to generate a unique QR code.");
    }
}
