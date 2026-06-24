using AutoMapper;
using Microsoft.Extensions.Configuration;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Domain.Specifications;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class QrService : IQrService
{
    private const int MaxAccessDurationMinutes = 1440;

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly SoftDeleteService _softDelete;
    private readonly string _publicWebBaseUrl;

    public QrService(IUnitOfWork uow, IMapper mapper, SoftDeleteService softDelete, IConfiguration configuration)
    {
        _uow = uow;
        _mapper = mapper;
        _softDelete = softDelete;
        _publicWebBaseUrl = (configuration["PublicWeb:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
    }

    public async Task<IReadOnlyList<QrDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var items = await _uow.QrLocations.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return items.Select(MapQr).ToArray();
    }

    public async Task<QrDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return qr is null ? null : MapQr(qr);
    }

    public async Task<QrDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations
            .GetByCodeAsync(code, activeOnly: true, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return qr is null ? null : MapQr(qr);
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

        if (qr.Poi is not null && !PoiAvailability.IsPubliclyAvailable(qr.Poi, DateTime.UtcNow))
        {
            return null;
        }

        return new QrResolveResponse
        {
            Qr = MapQr(qr),
            Poi = qr.Poi is null ? null : _mapper.Map<PoiDto>(qr.Poi),
            Tour = qr.Tour is null ? null : _mapper.Map<TourDto>(qr.Tour)
        };
    }

    public async Task<IReadOnlyList<QrDto>> GetPublicPackagesAsync(CancellationToken cancellationToken = default)
    {
        var packages = await _uow.QrLocations.GetActiveServiceLevelAsync(cancellationToken).ConfigureAwait(false);
        return packages.Select(MapQr).ToArray();
    }

    public async Task<QrDto> CreateAsync(CreateQrRequest request, CancellationToken cancellationToken = default)
    {
        var qrKind = request.QrKind ?? InferKind(request.PoiId, request.TourId);
        (request.PoiId, request.TourId) = NormalizeAndValidateKind(qrKind, request.PoiId, request.TourId);
        await ValidateTargetAsync(request.PoiId, request.TourId, cancellationToken).ConfigureAwait(false);

        var now = DateTime.UtcNow;
        var qr = _mapper.Map<QrLocation>(request);
        ApplyKindConfig(qr, qrKind, request.RequiresPayment, request.PriceAmount, request.AccessDurationMinutes);
        qr.Code = await GenerateUniqueCodeAsync(GetCodePrefix(request.PoiId, request.TourId), cancellationToken)
            .ConfigureAwait(false);
        qr.Name = string.IsNullOrWhiteSpace(request.Name) ? qr.Code : request.Name.Trim();
        qr.CreatedAt = now;
        qr.UpdatedAt = now;

        await _uow.QrLocations.AddAsync(qr, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var saved = await _uow.QrLocations.GetByIdAsync(qr.Id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return MapQr(saved!);
    }

    public async Task<QrDto> UpdateAsync(
        int id,
        UpdateQrRequest request,
        CancellationToken cancellationToken = default)
    {
        var qr = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(QrLocation), id);

        var qrKind = request.QrKind ?? InferKind(request.PoiId, request.TourId);
        (request.PoiId, request.TourId) = NormalizeAndValidateKind(qrKind, request.PoiId, request.TourId);
        await ValidateTargetAsync(request.PoiId, request.TourId, cancellationToken).ConfigureAwait(false);
        qr.PoiId = request.PoiId;
        qr.TourId = request.TourId;
        if (request.Name is not null)
        {
            var name = request.Name.Trim();
            if (name.Length == 0) throw new ValidationException(nameof(request.Name), "Tên QR không được để trống.");
            if (name.Length > 200) throw new ValidationException(nameof(request.Name), "Tên QR không được vượt quá 200 ký tự.");
            qr.Name = name;
        }

        if (request.IsActive.HasValue)
        {
            qr.IsActive = request.IsActive.Value;
        }

        ApplyKindConfig(qr, qrKind, request.RequiresPayment, request.PriceAmount, request.AccessDurationMinutes);

        qr.UpdatedAt = DateTime.UtcNow;

        _uow.QrLocations.Update(qr);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var saved = await _uow.QrLocations.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return MapQr(saved!);
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
        if (poiId.HasValue && tourId.HasValue)
        {
            throw new ValidationException(nameof(CreateQrRequest.TourId), "Mã QR chỉ được gắn với một POI hoặc một tour, không được chọn cả hai.");
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

    private static string GetCodePrefix(int? poiId, int? tourId)
    {
        if (poiId.HasValue)
        {
            return "POI";
        }

        return tourId.HasValue ? "TOUR" : "SERVICE";
    }

    private QrDto MapQr(QrLocation qr)
    {
        var dto = _mapper.Map<QrDto>(qr);
        dto.QrKind = InferKind(qr.PoiId, qr.TourId);
        dto.PublicUrl = dto.QrKind switch
        {
            QrKinds.Poi => $"{_publicWebBaseUrl}/dia-diem/{qr.PoiId}",
            QrKinds.Tour => $"{_publicWebBaseUrl}/tours/{qr.TourId}",
            _ => $"{_publicWebBaseUrl}/qr/{Uri.EscapeDataString(qr.Code)}"
        };
        return dto;
    }

    private static string InferKind(int? poiId, int? tourId) =>
        poiId.HasValue ? QrKinds.Poi : tourId.HasValue ? QrKinds.Tour : QrKinds.AudioPackage;

    private static (int? PoiId, int? TourId) NormalizeAndValidateKind(string? qrKind, int? poiId, int? tourId)
    {
        switch (qrKind)
        {
            case QrKinds.Poi when poiId.HasValue:
                return (poiId, null);
            case QrKinds.Tour when tourId.HasValue:
                return (null, tourId);
            case QrKinds.AudioPackage:
                return (null, null);
            case QrKinds.Poi:
                throw new ValidationException(nameof(CreateQrRequest.PoiId), "Vui lòng chọn POI cho mã QR.");
            case QrKinds.Tour:
                throw new ValidationException(nameof(CreateQrRequest.TourId), "Vui lòng chọn tour cho mã QR.");
            default:
                throw new ValidationException(nameof(CreateQrRequest.QrKind), "Loại mã QR không hợp lệ.");
        }
    }

    private static void ApplyKindConfig(QrLocation qr, string qrKind, bool? requiresPayment, decimal? price, int? duration)
    {
        if (qrKind != QrKinds.AudioPackage)
        {
            ApplyPaymentConfig(qr, false, 0m, 60);
            return;
        }

        ApplyPaymentConfig(qr, requiresPayment, price, duration);
    }

    private static void ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ValidationException(nameof(CreateQrRequest.Code), "Mã QR là bắt buộc.");
        }
    }

    private static void ApplyPaymentConfig(
        QrLocation qr,
        bool? requiresPayment,
        decimal? priceAmount,
        int? accessDurationMinutes)
    {
        var nextRequiresPayment = requiresPayment ?? qr.RequiresPayment;
        var nextPriceAmount = priceAmount ?? qr.PriceAmount;
        var nextAccessDurationMinutes = accessDurationMinutes ?? qr.AccessDurationMinutes;

        if (nextPriceAmount < 0)
        {
            throw new ValidationException(nameof(UpdateQrRequest.PriceAmount), "Giá không được nhỏ hơn 0.");
        }

        if (nextRequiresPayment && nextPriceAmount <= 0)
        {
            throw new ValidationException(
                nameof(UpdateQrRequest.PriceAmount),
                "Giá phải lớn hơn 0 khi mã QR yêu cầu thanh toán.");
        }

        if (nextAccessDurationMinutes is <= 0 or > MaxAccessDurationMinutes)
        {
            throw new ValidationException(
                nameof(UpdateQrRequest.AccessDurationMinutes),
                $"Thời lượng truy cập phải từ 1 đến {MaxAccessDurationMinutes} phút.");
        }

        qr.RequiresPayment = nextRequiresPayment;
        qr.PriceAmount = nextPriceAmount;
        qr.AccessDurationMinutes = nextAccessDurationMinutes;
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

        throw new ValidationException(nameof(CreateQrRequest.Code), "Không thể tạo mã QR duy nhất. Vui lòng thử lại.");
    }
}
