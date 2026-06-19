using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
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
    private const int MaxPoiTranslationNameLength = 200;
    private const int MaxPoiTranslationShortDescriptionLength = 500;

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly SoftDeleteService _softDelete;
    private readonly IFileUploadService _fileUploadService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITranslationService _translationService;
    private readonly ILogger<PoiService> _logger;
    private const string PoiUploadDirectory = "uploads/pois";

    public PoiService(
        IUnitOfWork uow,
        IMapper mapper,
        SoftDeleteService softDelete,
        IFileUploadService fileUploadService,
        IHttpContextAccessor httpContextAccessor,
        ITranslationService translationService,
        ILogger<PoiService> logger)
    {
        _uow = uow;
        _mapper = mapper;
        _softDelete = softDelete;
        _fileUploadService = fileUploadService;
        _httpContextAccessor = httpContextAccessor;
        _translationService = translationService;
        _logger = logger;
    }

    public async Task<PoiDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return poi is null ? null : _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false);
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
        // Delegate to repository which already applies filters and supports includeDeleted/IgnoreQueryFilters.
        var ownerUserId = IsCurrentUserVendor() ? GetCurrentUserId() : null;
        var (items, total) = await _uow.Pois.GetPagedAsync(
            page,
            pageSize,
            search,
            category,
            isActive,
            approvalStatus,
            ownerUserId,
            includeDeleted,
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
        var poi = _mapper.Map<Poi>(request);
        poi.Code = await GenerateUniqueCodeAsync("POI", cancellationToken).ConfigureAwait(false);
        poi.UserId = ResolveOwnerUserIdForCreate(request.UserId);
        poi.ImageUrl = imageUrls.FirstOrDefault();
        poi.ImageUrls = SerializeImageUrls(imageUrls);
        poi.CreatedAt = now;
        poi.UpdatedAt = now;

        await _uow.Pois.AddAsync(poi, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await CreateRequestedTranslationsAsync(
                poi,
                ResolveSelectedLanguageCodes(request),
                cancellationToken)
            .ConfigureAwait(false);

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
        if (request.IsActive.HasValue) poi.IsActive = request.IsActive.Value;

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
        if (shouldResetApprovalStatus) poi.ApprovalStatus = ApprovalStatus.Pending;

        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;
        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        if (request.ReTranslateAdditionalLanguages)
        {
            await ReTranslateExistingTranslationsAsync(poi, cancellationToken).ConfigureAwait(false);
        }

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto> UpdateApprovalStatusAsync(
        int id,
        UpdatePoiApprovalStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(request.ApprovalStatus))
        {
            throw new ValidationException(nameof(request.ApprovalStatus), "Approval status is invalid.");
        }

        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        poi.ApprovalStatus = request.ApprovalStatus;
        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;

        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        await _softDelete.SoftDeleteAsync(poi, SyncEntityTypes.POI, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        _uow.Pois.SoftDelete(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task RestoreAsync(int id, CancellationToken cancellationToken = default)
    {
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

    private async Task CreateRequestedTranslationsAsync(
        Poi poi,
        IEnumerable<string> selectedLanguageCodes,
        CancellationToken cancellationToken)
    {
        var languageCodes = selectedLanguageCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim().ToLowerInvariant())
            .Where(code => code != "vi")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (languageCodes.Count == 0)
        {
            _logger.LogInformation(
                "No selected language codes received for POI {PoiId}. Skipping auto-translation.",
                poi.Id);
            return;
        }

        _logger.LogInformation(
            "Creating POI translations for POI {PoiId}. Languages: {LanguageCodes}",
            poi.Id,
            string.Join(", ", languageCodes));

        foreach (var languageCode in languageCodes)
        {
            try
            {
                var language = await _uow.Languages.GetByCodeAsync(languageCode, cancellationToken)
                    .ConfigureAwait(false);
                if (language is null || !language.IsActive)
                {
                    _logger.LogWarning(
                        "Skipping POI translation for unsupported or inactive language {LanguageCode}. POI id: {PoiId}",
                        languageCode,
                        poi.Id);
                    continue;
                }

                if (await _uow.PoiTranslations
                        .GetByPoiAndLanguageAsync(poi.Id, languageCode, cancellationToken)
                        .ConfigureAwait(false) is not null)
                {
                    continue;
                }

                var now = DateTime.UtcNow;
                var translatedName = await TranslatePoiTextSafelyAsync(
                        poi.Name,
                        languageCode,
                        nameof(PoiTranslation.Name),
                        cancellationToken)
                    .ConfigureAwait(false);
                await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken).ConfigureAwait(false);

                var translatedShortDescription = await TranslatePoiOptionalTextSafelyAsync(
                        poi.ShortDescription,
                        languageCode,
                        nameof(PoiTranslation.ShortDescription),
                        cancellationToken)
                    .ConfigureAwait(false);
                await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken).ConfigureAwait(false);

                var translatedDescription = await TranslatePoiOptionalTextSafelyAsync(
                        poi.Description,
                        languageCode,
                        nameof(PoiTranslation.Description),
                        cancellationToken)
                    .ConfigureAwait(false);
                await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken).ConfigureAwait(false);

                await _uow.PoiTranslations.AddAsync(new PoiTranslation
                {
                    POIId = poi.Id,
                    LanguageCode = languageCode,
                    Name = Truncate(translatedName, MaxPoiTranslationNameLength) ?? string.Empty,
                    ShortDescription = Truncate(translatedShortDescription, MaxPoiTranslationShortDescriptionLength),
                    Description = translatedDescription ?? string.Empty,
                    CreatedAt = now,
                    UpdatedAt = now
                }, cancellationToken).ConfigureAwait(false);

                await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to auto-translate POI {PoiId} to language {LanguageCode}. POI was saved.",
                    poi.Id,
                    languageCode);
            }
        }
    }

    private IReadOnlyList<string> ResolveSelectedLanguageCodes(CreatePoiRequest request)
    {
        var languageCodes = request.SelectedLanguageCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToList();

        var form = _httpContextAccessor.HttpContext?.Request.HasFormContentType == true
            ? _httpContextAccessor.HttpContext.Request.Form
            : null;

        if (form is not null)
        {
            languageCodes.AddRange(form["SelectedLanguageCodes"]
                .Where(code => !string.IsNullOrWhiteSpace(code))
                .Select(code => code!));

            foreach (var key in form.Keys.Where(key => key.StartsWith("SelectedLanguageCodes[", StringComparison.OrdinalIgnoreCase)))
            {
                languageCodes.AddRange(form[key]
                    .Where(code => !string.IsNullOrWhiteSpace(code))
                    .Select(code => code!));
            }

            if (string.IsNullOrWhiteSpace(request.SelectedLanguageCodesJson))
            {
                request.SelectedLanguageCodesJson = form["SelectedLanguageCodesJson"].FirstOrDefault();
            }
        }

        if (!string.IsNullOrWhiteSpace(request.SelectedLanguageCodesJson))
        {
            try
            {
                var parsedCodes = JsonSerializer.Deserialize<string[]>(request.SelectedLanguageCodesJson) ?? [];
                languageCodes.AddRange(parsedCodes);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid SelectedLanguageCodesJson received while creating POI.");
            }
        }

        if (languageCodes.Count == 0 && IsCurrentUserVendor())
        {
            languageCodes.Add("en");
        }

        return languageCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim().ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private async Task<string> TranslatePoiTextAsync(
        string text,
        string languageCode,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        return await _translationService.TranslateAsync(text, languageCode, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<string> TranslatePoiTextSafelyAsync(
        string text,
        string languageCode,
        string fieldName,
        CancellationToken cancellationToken)
    {
        try
        {
            return await TranslatePoiTextAsync(text, languageCode, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Failed to translate POI field {FieldName} to language {LanguageCode}. Using source text as fallback.",
                fieldName,
                languageCode);
            return text;
        }
    }

    private async Task<string?> TranslatePoiOptionalTextAsync(
        string? text,
        string languageCode,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return text;
        }

        return await _translationService.TranslateAsync(text, languageCode, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<string?> TranslatePoiOptionalTextSafelyAsync(
        string? text,
        string languageCode,
        string fieldName,
        CancellationToken cancellationToken)
    {
        try
        {
            return await TranslatePoiOptionalTextAsync(text, languageCode, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Failed to translate POI field {FieldName} to language {LanguageCode}. Using source text as fallback.",
                fieldName,
                languageCode);
            return text;
        }
    }

    private async Task ReTranslateExistingTranslationsAsync(
        Poi poi,
        CancellationToken cancellationToken)
    {
        var translations = await _uow.PoiTranslations.GetByPoiIdAsync(poi.Id, cancellationToken)
            .ConfigureAwait(false);

        foreach (var translation in translations.Where(translation => translation.LanguageCode != "vi"))
        {
            try
            {
                var languageCode = translation.LanguageCode.Trim().ToLowerInvariant();
                var language = await _uow.Languages.GetByCodeAsync(languageCode, cancellationToken)
                    .ConfigureAwait(false);
                if (language is null || !language.IsActive)
                {
                    _logger.LogWarning(
                        "Skipping POI re-translation for unsupported or inactive language {LanguageCode}. POI id: {PoiId}",
                        languageCode,
                        poi.Id);
                    continue;
                }

                translation.Name = Truncate(
                    await TranslatePoiTextSafelyAsync(
                            poi.Name,
                            languageCode,
                            nameof(PoiTranslation.Name),
                            cancellationToken)
                        .ConfigureAwait(false),
                    MaxPoiTranslationNameLength) ?? string.Empty;
                await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken).ConfigureAwait(false);

                translation.ShortDescription = Truncate(
                    await TranslatePoiOptionalTextSafelyAsync(
                            poi.ShortDescription,
                            languageCode,
                            nameof(PoiTranslation.ShortDescription),
                            cancellationToken)
                        .ConfigureAwait(false),
                    MaxPoiTranslationShortDescriptionLength);
                await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken).ConfigureAwait(false);

                translation.Description = await TranslatePoiOptionalTextSafelyAsync(
                            poi.Description,
                            languageCode,
                            nameof(PoiTranslation.Description),
                            cancellationToken)
                        .ConfigureAwait(false)
                    ?? string.Empty;
                await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken).ConfigureAwait(false);

                translation.Version++;
                translation.UpdatedAt = DateTime.UtcNow;
                _uow.PoiTranslations.Update(translation);
                await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to re-translate POI {PoiId} to language {LanguageCode}. POI update was saved.",
                    poi.Id,
                    translation.LanguageCode);
            }
        }
    }

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value) || value.Length <= maxLength)
        {
            return value;
        }

        return value[..maxLength];
    }

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
