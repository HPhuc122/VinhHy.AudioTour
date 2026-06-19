using AutoMapper;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Text.Json;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PoiService : IPoiService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly SoftDeleteService _softDelete;
    private readonly IFileUploadService _fileUploadService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string PoiUploadDirectory = "uploads/pois";

    public PoiService(
        IUnitOfWork uow,
        IMapper mapper,
        SoftDeleteService softDelete,
        IFileUploadService fileUploadService,
        IHttpContextAccessor httpContextAccessor)
    {
        _uow = uow;
        _mapper = mapper;
        _softDelete = softDelete;
        _fileUploadService = fileUploadService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<PoiDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        EnsureVendorCanView(poi);
        return poi is null ? null : _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false);
        EnsureVendorCanView(poi);
        return poi is null ? null : _mapper.Map<PoiDto>(poi);
    }

    public async Task<PagedResult<PoiDto>> GetPagedAsync(
        PoiListFilter filter,
        CancellationToken cancellationToken = default)
    {
        // Backwards-compatible wrapper that delegates to new signature
        return await GetPagedAsync(filter.Page, filter.PageSize, filter.Search, filter.Category, filter.IsActive, filter.ApprovalStatus, filter.IncludeDeleted, cancellationToken).ConfigureAwait(false);
    }

    public async Task<PagedResult<PoiDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? category = null,
        bool? isActive = null,
        ApprovalStatus? approvalStatus = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        var isVendor = IsCurrentUserVendor();
        int? ownerUserId = isVendor ? GetRequiredCurrentUserId("list POIs") : null;
        var (items, total) = await _uow.Pois.GetPagedAsync(
            page,
            pageSize,
            search,
            category,
            isActive,
            approvalStatus,
            ownerUserId,
            isVendor ? false : includeDeleted,
            cancellationToken).ConfigureAwait(false);

        return PagedResult<PoiDto>.Create(
            _mapper.Map<IReadOnlyList<PoiDto>>(items),
            page,
            pageSize,
            total);
    }

    public async Task<PoiDto> CreateAsync(
        CreatePoiRequest request,
        CancellationToken cancellationToken = default)
    {
        var imageUrls = await SavePoiImagesAsync(request.Images, request.Image, cancellationToken)
            .ConfigureAwait(false);

        var now = DateTime.UtcNow;
        var isVendor = IsCurrentUserVendor();
        var poi = _mapper.Map<Poi>(request);
        poi.Code = await GenerateUniqueCodeAsync("POI", cancellationToken).ConfigureAwait(false);
        poi.UserId = ResolveOwnerUserIdForCreate(request.UserId);
        if (isVendor)
        {
            poi.ApprovalStatus = ApprovalStatus.Pending;
            poi.IsActive = false;
            poi.PaymentRequired = true;
            poi.PaymentStatus = PoiPaymentStatus.PendingPayment;
            poi.ActivatedAt = null;
            poi.ActivatedByUserId = null;
        }
        else
        {
            var paymentRequired = request.PaymentRequired ?? false;
            poi.ApprovalStatus = ApprovalStatus.Approved;
            poi.PaymentRequired = paymentRequired;
            poi.PaymentStatus = paymentRequired ? PoiPaymentStatus.PendingPayment : PoiPaymentStatus.NotRequired;
            poi.IsActive = !paymentRequired;
            poi.ActivatedAt = paymentRequired ? null : now;
            poi.ActivatedByUserId = paymentRequired ? null : GetCurrentUserId();
        }
        poi.ImageUrl = imageUrls.FirstOrDefault();
        poi.ImageUrls = SerializeImageUrls(imageUrls);
        poi.CreatedAt = now;
        poi.UpdatedAt = now;

        await _uow.Pois.AddAsync(poi, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto> UpdateAsync(
        int id,
        UpdatePoiRequest request,
        CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        var isVendor = IsCurrentUserVendor();
        ApplyOwnerUserIdForUpdate(poi, request.UserId);
        EnsureVendorCanEdit(poi);

        var hasNewImages = request.Images.Any(image => image.Length > 0) ||
            (request.Image is not null && request.Image.Length > 0);
        var shouldResetApprovalStatus = isVendor && HasApprovalSensitiveUpdate(poi, request, hasNewImages);

        if (request.Name is not null) poi.Name = request.Name;
        if (request.ShortDescription is not null) poi.ShortDescription = request.ShortDescription;
        if (request.Description is not null) poi.Description = request.Description;
        if (request.Latitude.HasValue) poi.Latitude = request.Latitude.Value;
        if (request.Longitude.HasValue) poi.Longitude = request.Longitude.Value;
        if (request.RadiusMeters.HasValue) poi.RadiusMeters = request.RadiusMeters.Value;
        if (request.Priority.HasValue) poi.Priority = request.Priority.Value;
        if (!isVendor && request.PaymentRequired.HasValue)
        {
            poi.PaymentRequired = request.PaymentRequired.Value;
            if (!poi.PaymentRequired && poi.PaymentStatus == PoiPaymentStatus.PendingPayment)
            {
                poi.PaymentStatus = PoiPaymentStatus.NotRequired;
            }
        }

        if (!isVendor && request.IsActive.HasValue)
        {
            if (request.IsActive.Value && !CanActivate(poi))
            {
                throw new ValidationException(nameof(request.IsActive), "POI must be approved and paid, waived, or not payment-required before activation.");
            }

            poi.IsActive = request.IsActive.Value;
            if (poi.IsActive)
            {
                poi.ActivatedAt ??= DateTime.UtcNow;
                poi.ActivatedByUserId ??= GetCurrentUserId();
            }
        }

        if (hasNewImages)
        {
            DeletePoiImages(poi);

            var imageUrls = await SavePoiImagesAsync(request.Images, request.Image, cancellationToken)
                .ConfigureAwait(false);
            poi.ImageUrl = imageUrls.FirstOrDefault();
            poi.ImageUrls = SerializeImageUrls(imageUrls);
        }
        else if (request.ImageUrl is not null)
        {
            // Only update if explicitly provided (not null from client)
            poi.ImageUrl = request.ImageUrl;
            poi.ImageUrls = SerializeImageUrls([request.ImageUrl]);
        }

        if (request.Category is not null) poi.Category = request.Category;
        if (request.CooldownSeconds.HasValue) poi.CooldownSeconds = request.CooldownSeconds.Value;
        if (request.MinDwellSeconds.HasValue) poi.MinDwellSeconds = request.MinDwellSeconds.Value;
        if (shouldResetApprovalStatus)
        {
            poi.ApprovalStatus = ApprovalStatus.Pending;
            poi.IsActive = false;
            poi.PaymentRequired = true;
            poi.PaymentStatus = PoiPaymentStatus.PendingPayment;
            poi.ActivatedAt = null;
            poi.ActivatedByUserId = null;
        }

        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;
        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto> UpdateApprovalStatusAsync(
        int id,
        UpdatePoiApprovalStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureCurrentUserIsNotVendor("approve or reject POIs");

        if (!Enum.IsDefined(request.ApprovalStatus))
        {
            throw new ValidationException(nameof(request.ApprovalStatus), "Approval status is invalid.");
        }

        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        poi.ApprovalStatus = request.ApprovalStatus;
        if (request.ApprovalStatus == ApprovalStatus.Approved)
        {
            if (poi.PaymentRequired)
            {
                if (poi.PaymentStatus is PoiPaymentStatus.Paid or PoiPaymentStatus.Waived)
                {
                    poi.IsActive = true;
                    poi.ActivatedAt ??= DateTime.UtcNow;
                    poi.ActivatedByUserId ??= GetCurrentUserId();
                }
                else
                {
                    poi.PaymentStatus = PoiPaymentStatus.PendingPayment;
                    poi.IsActive = false;
                    poi.ActivatedAt = null;
                    poi.ActivatedByUserId = null;
                }
            }
            else
            {
                poi.PaymentStatus = PoiPaymentStatus.NotRequired;
                poi.IsActive = true;
                poi.ActivatedAt ??= DateTime.UtcNow;
                poi.ActivatedByUserId ??= GetCurrentUserId();
            }
        }
        else
        {
            poi.IsActive = false;
            poi.ActivatedAt = null;
            poi.ActivatedByUserId = null;
        }
        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;

        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto> MarkPaidAsync(
        int id,
        int activatedByUserId,
        CancellationToken cancellationToken = default)
    {
        return await ActivateAfterPaymentAsync(
            id,
            PoiPaymentStatus.Paid,
            activatedByUserId,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<PoiDto> WaivePaymentAsync(
        int id,
        int activatedByUserId,
        CancellationToken cancellationToken = default)
    {
        return await ActivateAfterPaymentAsync(
            id,
            PoiPaymentStatus.Waived,
            activatedByUserId,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<PoiDto> ActivateAfterPaymentAsync(
        int id,
        PoiPaymentStatus paymentStatus,
        int activatedByUserId,
        CancellationToken cancellationToken)
    {
        EnsureCurrentUserIsNotVendor("activate POI payments");

        if (paymentStatus is not (PoiPaymentStatus.Paid or PoiPaymentStatus.Waived))
        {
            throw new ValidationException(nameof(paymentStatus), "Payment status must be Paid or Waived.");
        }

        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        if (poi.ApprovalStatus != ApprovalStatus.Approved)
        {
            throw new ValidationException(nameof(poi.ApprovalStatus), "Only approved POIs can be activated.");
        }

        poi.PaymentRequired = paymentStatus == PoiPaymentStatus.Paid;
        poi.PaymentStatus = paymentStatus;
        poi.IsActive = true;
        poi.ActivatedAt = DateTime.UtcNow;
        poi.ActivatedByUserId = activatedByUserId;
        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;

        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        EnsureCurrentUserIsNotVendor("delete POIs");

        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        await _softDelete.SoftDeleteAsync(poi, SyncEntityTypes.POI, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        _uow.Pois.SoftDelete(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task RestoreAsync(int id, CancellationToken cancellationToken = default)
    {
        EnsureCurrentUserIsNotVendor("restore POIs");

        var poi = await _uow.Pois.GetByIdAsync(id, includeDeleted: true, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        // Restore soft-delete
        poi.DeletedAt = null;
        poi.IsActive = true;
        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;

        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task<string> GenerateUniqueCodeAsync(string prefix, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            var code = $"{prefix}-{suffix}";
            var existing = await _uow.Pois.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false);

            if (existing is null)
            {
                return code;
            }
        }

        throw new ValidationException(nameof(Poi.Code), "Unable to generate a unique POI code.");
    }

    private int? GetCurrentUserId()
    {
        var value = _httpContextAccessor.HttpContext?.User
            .FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return int.TryParse(value, out var userId) ? userId : null;
    }

    private int GetRequiredCurrentUserId(string action)
    {
        return GetCurrentUserId()
            ?? throw new UnauthorizedException($"Current user id is required to {action}.");
    }

    private void EnsureVendorCanView(Poi? poi)
    {
        if (poi is null || !IsCurrentUserVendor())
        {
            return;
        }

        var currentUserId = GetRequiredCurrentUserId("view this POI");
        if (poi.UserId != currentUserId)
        {
            throw new UnauthorizedException("You are not allowed to view this POI.");
        }
    }

    private void EnsureVendorCanEdit(Poi poi)
    {
        if (!IsCurrentUserVendor())
        {
            return;
        }

        if (poi.ApprovalStatus == ApprovalStatus.Approved)
        {
            throw new UnauthorizedException("Approved POIs cannot be edited by vendors.");
        }
    }

    private void EnsureCurrentUserIsNotVendor(string action)
    {
        if (IsCurrentUserVendor())
        {
            throw new UnauthorizedException($"Vendors are not allowed to {action}.");
        }
    }

    private int? ResolveOwnerUserIdForCreate(int? requestedUserId)
    {
        return IsCurrentUserVendor()
            ? GetCurrentUserId() ?? throw new UnauthorizedException("Current user id is required to create a POI.")
            : NormalizeOwnerUserId(requestedUserId);
    }

    private void ApplyOwnerUserIdForUpdate(Poi poi, int? requestedUserId)
    {
        if (!IsCurrentUserVendor())
        {
            if (requestedUserId.HasValue)
            {
                poi.UserId = NormalizeOwnerUserId(requestedUserId);
            }

            return;
        }

        var currentUserId = GetCurrentUserId()
            ?? throw new UnauthorizedException("Current user id is required to update a POI.");

        if (poi.UserId != currentUserId)
        {
            throw new UnauthorizedException("You are not allowed to update this POI.");
        }
    }

    private static int? NormalizeOwnerUserId(int? userId) =>
        userId.GetValueOrDefault() > 0 ? userId : null;

    private static bool CanActivate(Poi poi) =>
        poi.ApprovalStatus == ApprovalStatus.Approved &&
        (!poi.PaymentRequired || poi.PaymentStatus is PoiPaymentStatus.NotRequired or PoiPaymentStatus.Paid or PoiPaymentStatus.Waived);

    private static bool HasApprovalSensitiveUpdate(Poi poi, UpdatePoiRequest request, bool hasNewImages)
    {
        return hasNewImages ||
            HasStringChanged(request.Name, poi.Name) ||
            HasStringChanged(request.ShortDescription, poi.ShortDescription) ||
            HasStringChanged(request.Description, poi.Description) ||
            HasStringChanged(request.ImageUrl, poi.ImageUrl) ||
            HasStringChanged(request.Category, poi.Category) ||
            (request.Latitude.HasValue && request.Latitude.Value != poi.Latitude) ||
            (request.Longitude.HasValue && request.Longitude.Value != poi.Longitude) ||
            (request.RadiusMeters.HasValue && request.RadiusMeters.Value != poi.RadiusMeters) ||
            (request.Priority.HasValue && request.Priority.Value != poi.Priority) ||
            (request.CooldownSeconds.HasValue && request.CooldownSeconds.Value != poi.CooldownSeconds) ||
            (request.MinDwellSeconds.HasValue && request.MinDwellSeconds.Value != poi.MinDwellSeconds);
    }

    private static bool HasStringChanged(string? requestedValue, string? currentValue) =>
        requestedValue is not null &&
        !string.Equals(
            NormalizeOptionalText(requestedValue),
            NormalizeOptionalText(currentValue),
            StringComparison.Ordinal);

    private static string NormalizeOptionalText(string? value) => value ?? string.Empty;

    private bool IsCurrentUserVendor()
    {
        var role = _httpContextAccessor.HttpContext?.User
            .FindFirst(ClaimTypes.Role)?.Value;

        return string.Equals(role, RoleNames.Vendor, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<IReadOnlyList<string>> SavePoiImagesAsync(
        IEnumerable<IFormFile> images,
        IFormFile? fallbackImage,
        CancellationToken cancellationToken)
    {
        var files = images
            .Where(image => image.Length > 0)
            .ToList();

        if (files.Count == 0 && fallbackImage is not null && fallbackImage.Length > 0)
        {
            files.Add(fallbackImage);
        }

        var urls = new List<string>(files.Count);
        foreach (var file in files)
        {
            var url = await _fileUploadService.SaveFileAsync(file, PoiUploadDirectory, cancellationToken)
                .ConfigureAwait(false);
            urls.Add(url);
        }

        return urls;
    }

    private void DeletePoiImages(Poi poi)
    {
        var urls = DeserializeImageUrls(poi.ImageUrls).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(poi.ImageUrl))
        {
            urls.Add(poi.ImageUrl);
        }

        foreach (var url in urls)
        {
            _fileUploadService.DeleteFile(url);
        }
    }

    private static string? SerializeImageUrls(IReadOnlyList<string> imageUrls) =>
        imageUrls.Count == 0 ? null : JsonSerializer.Serialize(imageUrls);

    private static IReadOnlyList<string> DeserializeImageUrls(string? imageUrls)
    {
        if (string.IsNullOrWhiteSpace(imageUrls))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(imageUrls) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
