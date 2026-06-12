using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PoiTranslationService : IPoiTranslationService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public PoiTranslationService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<PoiTranslationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var item = await _uow.PoiTranslations.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return item is null ? null : _mapper.Map<PoiTranslationDto>(item);
    }

    public async Task<IReadOnlyList<PoiTranslationDto>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default)
    {
        var items = await _uow.PoiTranslations.GetByPoiIdAsync(poiId, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<PoiTranslationDto>>(items);
    }

    public async Task<PoiTranslationDto> CreateAsync(
        CreatePoiTranslationRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = await _uow.Pois.GetByIdAsync(request.POIId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), request.POIId);

        await ValidateLanguageAsync(request.LanguageCode, nameof(request.LanguageCode), cancellationToken)
            .ConfigureAwait(false);

        if (await _uow.PoiTranslations
                .GetByPoiAndLanguageAsync(request.POIId, request.LanguageCode, cancellationToken)
                .ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.LanguageCode), "Translation for this language already exists.");

        var now = DateTime.UtcNow;
        var translation = _mapper.Map<PoiTranslation>(request);
        translation.CreatedAt = now;
        translation.UpdatedAt = now;

        await _uow.PoiTranslations.AddAsync(translation, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiTranslationDto>(translation);
    }

    public async Task<PoiTranslationDto> UpdateAsync(
        int id,
        UpdatePoiTranslationRequest request,
        CancellationToken cancellationToken = default)
    {
        var translation = await _uow.PoiTranslations.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(PoiTranslation), id);

        if (request.Name is not null) translation.Name = request.Name;
        if (request.Description is not null) translation.Description = request.Description;
        if (request.ShortDescription is not null) translation.ShortDescription = request.ShortDescription;

        translation.Version++;
        translation.UpdatedAt = DateTime.UtcNow;
        _uow.PoiTranslations.Update(translation);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiTranslationDto>(translation);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var translation = await _uow.PoiTranslations.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(PoiTranslation), id);

        _uow.PoiTranslations.Delete(translation);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task ValidateLanguageAsync(
        string languageCode,
        string fieldName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
        {
            throw new ValidationException(fieldName, "Language is required.");
        }

        var language = await _uow.Languages.GetByCodeAsync(languageCode, cancellationToken)
            .ConfigureAwait(false);

        if (language is null || !language.IsActive)
        {
            throw new ValidationException(fieldName, "Language does not exist or is inactive.");
        }
    }
}
