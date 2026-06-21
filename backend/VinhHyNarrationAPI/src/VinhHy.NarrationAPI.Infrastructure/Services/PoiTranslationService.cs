using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PoiTranslationService : IPoiTranslationService
{
    private const int MaxNameLength = 200;
    private const int MaxShortDescriptionLength = 500;
    private const int MaxLanguageCodeLength = 10;

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly ITranslationProvider _translationProvider;

    public PoiTranslationService(IUnitOfWork uow, IMapper mapper, ITranslationProvider translationProvider)
    {
        _uow = uow;
        _mapper = mapper;
        _translationProvider = translationProvider;
    }

    public async Task<PoiTranslationDto?> GetByIdAsync(
        int id,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default)
    {
        var item = await _uow.PoiTranslations.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        if (item is not null)
        {
            await EnsurePoiAccessAsync(item.POIId, requesterUserId, requireOwnedPoi, cancellationToken)
                .ConfigureAwait(false);
        }

        return item is null ? null : _mapper.Map<PoiTranslationDto>(item);
    }

    public async Task<IReadOnlyList<PoiTranslationDto>> GetByPoiIdAsync(
        int poiId,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default)
    {
        await EnsurePoiAccessAsync(poiId, requesterUserId, requireOwnedPoi, cancellationToken)
            .ConfigureAwait(false);

        var items = await _uow.PoiTranslations.GetByPoiIdAsync(poiId, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<PoiTranslationDto>>(items);
    }

    public async Task<PoiTranslationDto> CreateAsync(
        CreatePoiTranslationRequest request,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default)
    {
        await EnsurePoiAccessAsync(request.POIId, requesterUserId, requireOwnedPoi, cancellationToken)
            .ConfigureAwait(false);

        await ValidateLanguageAsync(request.LanguageCode, nameof(request.LanguageCode), cancellationToken)
            .ConfigureAwait(false);

        ValidateRequiredText(request.Name, nameof(request.Name), MaxNameLength);
        ValidateRequiredText(request.Description, nameof(request.Description));
        ValidateOptionalText(request.ShortDescription, nameof(request.ShortDescription), MaxShortDescriptionLength);

        var languageCode = NormalizeLanguageCode(request.LanguageCode);
        if (await _uow.PoiTranslations
                .GetByPoiAndLanguageAsync(request.POIId, languageCode, cancellationToken)
                .ConfigureAwait(false) is not null)
        {
            throw new ValidationException(nameof(request.LanguageCode), "POI này đã có bản dịch cho ngôn ngữ đã chọn.");
        }

        var now = DateTime.UtcNow;
        var translation = _mapper.Map<PoiTranslation>(request);
        translation.LanguageCode = languageCode;
        translation.Name = request.Name.Trim();
        translation.Description = request.Description.Trim();
        translation.ShortDescription = string.IsNullOrWhiteSpace(request.ShortDescription) ? null : request.ShortDescription.Trim();
        translation.CreatedAt = now;
        translation.UpdatedAt = now;

        await _uow.PoiTranslations.AddAsync(translation, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiTranslationDto>(translation);
    }

    public async Task<PoiTranslationDto> UpdateAsync(
        int id,
        UpdatePoiTranslationRequest request,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default)
    {
        var translation = await _uow.PoiTranslations.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(PoiTranslation), id);

        await EnsurePoiAccessAsync(translation.POIId, requesterUserId, requireOwnedPoi, cancellationToken)
            .ConfigureAwait(false);

        if (request.Name is not null)
        {
            ValidateRequiredText(request.Name, nameof(request.Name), MaxNameLength);
            translation.Name = request.Name.Trim();
        }

        if (request.Description is not null)
        {
            ValidateRequiredText(request.Description, nameof(request.Description));
            translation.Description = request.Description.Trim();
        }

        if (request.ShortDescription is not null)
        {
            ValidateOptionalText(request.ShortDescription, nameof(request.ShortDescription), MaxShortDescriptionLength);
            translation.ShortDescription = string.IsNullOrWhiteSpace(request.ShortDescription) ? null : request.ShortDescription.Trim();
        }

        translation.Version++;
        translation.UpdatedAt = DateTime.UtcNow;
        _uow.PoiTranslations.Update(translation);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiTranslationDto>(translation);
    }

    public async Task DeleteAsync(
        int id,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default)
    {
        var translation = await _uow.PoiTranslations.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(PoiTranslation), id);

        await EnsurePoiAccessAsync(translation.POIId, requesterUserId, requireOwnedPoi, cancellationToken)
            .ConfigureAwait(false);

        _uow.PoiTranslations.Delete(translation);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<GeneratePoiTranslationsResponse> GenerateAsync(
        GeneratePoiTranslationsRequest request,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default)
    {
        if (request.PoiId <= 0)
        {
            throw new ValidationException(nameof(request.PoiId), "Vui lòng chọn POI cần dịch.");
        }

        var poi = await EnsurePoiAccessAsync(request.PoiId, requesterUserId, requireOwnedPoi, cancellationToken)
            .ConfigureAwait(false);

        var sourceLanguageCode = NormalizeLanguageCode(request.SourceLanguageCode);
        await ValidateLanguageAsync(sourceLanguageCode, nameof(request.SourceLanguageCode), cancellationToken)
            .ConfigureAwait(false);

        var requestedTargetLanguageCodes = (request.TargetLanguageCodes ?? [])
            .Select(NormalizeLanguageCode)
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (requestedTargetLanguageCodes.Length == 0)
        {
            throw new ValidationException(nameof(request.TargetLanguageCodes), "Vui lòng chọn ít nhất một ngôn ngữ đích.");
        }

        if (requestedTargetLanguageCodes.Any(code => string.Equals(code, sourceLanguageCode, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ValidationException(nameof(request.TargetLanguageCodes), "Ngôn ngữ đích phải khác ngôn ngữ nguồn.");
        }

        foreach (var targetLanguageCode in requestedTargetLanguageCodes)
        {
            await ValidateLanguageAsync(targetLanguageCode, nameof(request.TargetLanguageCodes), cancellationToken)
                .ConfigureAwait(false);
        }

        var source = await ResolveSourceContentAsync(poi, sourceLanguageCode, cancellationToken)
            .ConfigureAwait(false);

        var generated = new List<PoiTranslation>();
        var skipped = new List<string>();
        var now = DateTime.UtcNow;

        foreach (var targetLanguageCode in requestedTargetLanguageCodes)
        {
            var existing = await _uow.PoiTranslations
                .GetByPoiAndLanguageAsync(poi.Id, targetLanguageCode, cancellationToken)
                .ConfigureAwait(false);

            if (existing is not null && !request.OverwriteExisting)
            {
                skipped.Add(targetLanguageCode);
                continue;
            }

            var translatedName = await TranslateRequiredAsync(source.Name, sourceLanguageCode, targetLanguageCode, cancellationToken)
                .ConfigureAwait(false);
            var translatedDescription = await TranslateRequiredAsync(source.Description, sourceLanguageCode, targetLanguageCode, cancellationToken)
                .ConfigureAwait(false);
            var translatedShortDescription = string.IsNullOrWhiteSpace(source.ShortDescription)
                ? null
                : await _translationProvider
                    .TranslateAsync(source.ShortDescription, sourceLanguageCode, targetLanguageCode, cancellationToken)
                    .ConfigureAwait(false);

            if (existing is null)
            {
                existing = new PoiTranslation
                {
                    POIId = poi.Id,
                    LanguageCode = targetLanguageCode,
                    CreatedAt = now
                };
                await _uow.PoiTranslations.AddAsync(existing, cancellationToken).ConfigureAwait(false);
            }
            else
            {
                existing.Version++;
                _uow.PoiTranslations.Update(existing);
            }

            existing.Name = TruncateRequired(translatedName, MaxNameLength);
            existing.ShortDescription = TruncateOptional(translatedShortDescription, MaxShortDescriptionLength);
            existing.Description = translatedDescription;
            existing.UpdatedAt = now;
            generated.Add(existing);
        }

        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new GeneratePoiTranslationsResponse
        {
            Translations = generated.Select(translation => _mapper.Map<PoiTranslationDto>(translation)).ToList(),
            SkippedLanguageCodes = skipped
        };
    }

    private async Task<Poi> EnsurePoiAccessAsync(
        int poiId,
        int? requesterUserId,
        bool requireOwnedPoi,
        CancellationToken cancellationToken)
    {
        var poi = await _uow.Pois.GetByIdAsync(poiId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), poiId);

        if (requireOwnedPoi && poi.UserId != requesterUserId)
        {
            throw new ForbiddenException("Vendors can only manage translations for their own POIs.");
        }

        return poi;
    }

    private async Task ValidateLanguageAsync(
        string languageCode,
        string fieldName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
        {
            throw new ValidationException(fieldName, "Vui lòng chọn ngôn ngữ.");
        }

        var normalizedCode = NormalizeLanguageCode(languageCode);
        if (normalizedCode.Length > MaxLanguageCodeLength)
        {
            throw new ValidationException(fieldName, $"Mã ngôn ngữ không được vượt quá {MaxLanguageCodeLength} ký tự.");
        }

        var language = await _uow.Languages.GetByCodeAsync(normalizedCode, cancellationToken)
            .ConfigureAwait(false);

        if (language is null || !language.IsActive)
        {
            throw new ValidationException(fieldName, "Ngôn ngữ không tồn tại hoặc đang bị tắt.");
        }
    }

    private async Task<SourcePoiContent> ResolveSourceContentAsync(
        Poi poi,
        string sourceLanguageCode,
        CancellationToken cancellationToken)
    {
        var sourceTranslation = await _uow.PoiTranslations
            .GetByPoiAndLanguageAsync(poi.Id, sourceLanguageCode, cancellationToken)
            .ConfigureAwait(false);

        var sourceName = sourceTranslation?.Name ?? poi.Name;
        var sourceShortDescription = sourceTranslation?.ShortDescription ?? poi.ShortDescription;
        var sourceDescription = sourceTranslation?.Description
            ?? poi.Description
            ?? poi.ShortDescription
            ?? poi.Name;

        if (string.IsNullOrWhiteSpace(sourceName) || string.IsNullOrWhiteSpace(sourceDescription))
        {
            throw new ValidationException(nameof(sourceLanguageCode), "POI chưa có nội dung nguồn để dịch.");
        }

        return new SourcePoiContent(
            sourceName.Trim(),
            string.IsNullOrWhiteSpace(sourceShortDescription) ? null : sourceShortDescription.Trim(),
            sourceDescription.Trim());
    }

    private async Task<string> TranslateRequiredAsync(
        string sourceText,
        string sourceLanguageCode,
        string targetLanguageCode,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sourceText))
        {
            throw new ValidationException(nameof(sourceText), "Nội dung nguồn không được để trống.");
        }

        return await _translationProvider
            .TranslateAsync(sourceText, sourceLanguageCode, targetLanguageCode, cancellationToken)
            .ConfigureAwait(false);
    }

    private static string NormalizeLanguageCode(string? languageCode) =>
        languageCode?.Trim().ToLowerInvariant() ?? string.Empty;

    private static void ValidateRequiredText(string? value, string fieldName, int? maxLength = null)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ValidationException(fieldName, GetRequiredMessage(fieldName));
        }

        if (maxLength.HasValue && value.Trim().Length > maxLength.Value)
        {
            throw new ValidationException(fieldName, $"{GetFieldLabel(fieldName)} không được vượt quá {maxLength.Value} ký tự.");
        }
    }

    private static void ValidateOptionalText(string? value, string fieldName, int maxLength)
    {
        if (!string.IsNullOrWhiteSpace(value) && value.Trim().Length > maxLength)
        {
            throw new ValidationException(fieldName, $"{GetFieldLabel(fieldName)} không được vượt quá {maxLength} ký tự.");
        }
    }

    private static string TruncateRequired(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private static string? TruncateOptional(string? value, int maxLength) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : value.Length <= maxLength
                ? value
                : value[..maxLength];

    private static string GetRequiredMessage(string fieldName) =>
        $"Vui lòng nhập {GetFieldLabel(fieldName).ToLowerInvariant()}.";

    private static string GetFieldLabel(string fieldName) =>
        fieldName switch
        {
            "Name" => "Tên bản dịch",
            "Description" => "Mô tả bản dịch",
            "ShortDescription" => "Mô tả ngắn",
            _ => fieldName
        };

    private sealed record SourcePoiContent(string Name, string? ShortDescription, string Description);
}
