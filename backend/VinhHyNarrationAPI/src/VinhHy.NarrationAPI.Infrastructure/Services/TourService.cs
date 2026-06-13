using AutoMapper;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class TourService : ITourService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly SoftDeleteService _softDelete;

    public TourService(IUnitOfWork uow, IMapper mapper, SoftDeleteService softDelete)
    {
        _uow = uow;
        _mapper = mapper;
        _softDelete = softDelete;
    }

    public async Task<TourDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var tour = await _uow.Tours.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return tour is null ? null : _mapper.Map<TourDto>(tour);
    }

    public async Task<PagedResult<TourDto>> GetPagedAsync(
        TourListFilter filter,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await _uow.Tours.GetPagedAsync(
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.IsActive,
            filter.IncludeDeleted,
            cancellationToken).ConfigureAwait(false);

        return PagedResult<TourDto>.Create(
            _mapper.Map<IReadOnlyList<TourDto>>(items),
            filter.Page,
            filter.PageSize,
            total);
    }

    public async Task<PublicTourDto?> GetPublicByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var tour = await _uow.Tours.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        if (tour is null || !tour.IsActive)
        {
            return null;
        }

        return MapPublicTour(tour);
    }

    public async Task<PagedResult<PublicTourDto>> GetPublicPagedAsync(
        TourListFilter filter,
        CancellationToken cancellationToken = default)
    {
        var page = filter.NormalizedPage;
        var pageSize = filter.NormalizedPageSize;
        var (items, total) = await _uow.Tours.GetPublicPagedAsync(
            page,
            pageSize,
            filter.Search,
            cancellationToken).ConfigureAwait(false);

        return PagedResult<PublicTourDto>.Create(
            items.Select(MapPublicTour).ToArray(),
            page,
            pageSize,
            total);
    }

    public async Task<TourDto> CreateAsync(
        CreateTourRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCode(request.Code);
        ValidateEstimatedMinutes(request.EstimatedMinutes);
        await ValidateLanguageAsync(request.DefaultLanguage, nameof(request.DefaultLanguage), cancellationToken)
            .ConfigureAwait(false);

        if (await _uow.Tours.GetByCodeAsync(request.Code, cancellationToken).ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.Code), "Tour code already exists.");

        var now = DateTime.UtcNow;
        var tour = _mapper.Map<Tour>(request);
        tour.CreatedAt = now;
        tour.UpdatedAt = now;

        await _uow.Tours.AddAsync(tour, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<TourDto>(tour);
    }

    public async Task<TourDto> UpdateAsync(
        int id,
        UpdateTourRequest request,
        CancellationToken cancellationToken = default)
    {
        var tour = await _uow.Tours.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), id);

        if (request.DefaultLanguage is not null)
        {
            await ValidateLanguageAsync(request.DefaultLanguage, nameof(request.DefaultLanguage), cancellationToken)
                .ConfigureAwait(false);
            tour.DefaultLanguage = request.DefaultLanguage;
        }

        if (request.EstimatedMinutes.HasValue)
        {
            ValidateEstimatedMinutes(request.EstimatedMinutes);
        }

        if (request.IsActive.HasValue) tour.IsActive = request.IsActive.Value;
        if (request.EstimatedMinutes.HasValue) tour.EstimatedMinutes = request.EstimatedMinutes;

        tour.Version++;
        tour.UpdatedAt = DateTime.UtcNow;
        _uow.Tours.Update(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<TourDto>(tour);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var tour = await _uow.Tours.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), id);

        await _softDelete.SoftDeleteAsync(tour, SyncEntityTypes.Tour, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        _uow.Tours.SoftDelete(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<TourTranslationDto> AddTranslationAsync(
        int tourId,
        CreateTourTranslationRequest request,
        CancellationToken cancellationToken = default)
    {
        var tour = await _uow.Tours.GetByIdAsync(tourId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), tourId);

        await ValidateLanguageAsync(request.LanguageCode, nameof(request.LanguageCode), cancellationToken)
            .ConfigureAwait(false);

        if (await _uow.TourTranslations
                .GetByTourAndLanguageAsync(tourId, request.LanguageCode, cancellationToken)
                .ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.LanguageCode), "Translation already exists.");

        var translation = _mapper.Map<TourTranslation>(request);
        translation.TourId = tourId;
        TouchTour(tour);

        await _uow.TourTranslations.AddAsync(translation, cancellationToken).ConfigureAwait(false);
        _uow.Tours.Update(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<TourTranslationDto>(translation);
    }

    public async Task<TourTranslationDto> UpdateTranslationAsync(
        int translationId,
        UpdateTourTranslationRequest request,
        CancellationToken cancellationToken = default)
    {
        var translation = await _uow.TourTranslations.GetByIdAsync(translationId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(TourTranslation), translationId);

        if (request.Name is not null) translation.Name = request.Name;
        if (request.Description is not null) translation.Description = request.Description;

        var tour = await _uow.Tours.GetByIdAsync(translation.TourId, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), translation.TourId);
        TouchTour(tour);

        _uow.TourTranslations.Update(translation);
        _uow.Tours.Update(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<TourTranslationDto>(translation);
    }

    public async Task DeleteTranslationAsync(int translationId, CancellationToken cancellationToken = default)
    {
        var translation = await _uow.TourTranslations.GetByIdAsync(translationId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(TourTranslation), translationId);

        var tour = await _uow.Tours.GetByIdAsync(translation.TourId, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), translation.TourId);

        _uow.TourTranslations.Delete(translation);
        TouchTour(tour);
        _uow.Tours.Update(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<TourPoiDto> AddPoiAsync(
        int tourId,
        AddTourPoiRequest request,
        CancellationToken cancellationToken = default)
    {
        var tour = await _uow.Tours.GetByIdAsync(tourId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), tourId);

        _ = await _uow.Pois.GetByIdAsync(request.POIId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), request.POIId);

        if (await _uow.TourPois.GetByTourAndPoiAsync(tourId, request.POIId, cancellationToken).ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.POIId), "POI is already on this tour.");

        var tourPoi = new TourPoi
        {
            TourId = tourId,
            POIId = request.POIId,
            OrderIndex = request.OrderIndex
        };

        await _uow.TourPois.AddAsync(tourPoi, cancellationToken).ConfigureAwait(false);
        TouchTour(tour);
        _uow.Tours.Update(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var saved = await _uow.TourPois.GetByIdAsync(tourPoi.Id, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<TourPoiDto>(saved!);
    }

    public async Task RemovePoiAsync(int tourId, int poiId, CancellationToken cancellationToken = default)
    {
        var tourPoi = await _uow.TourPois.GetByTourAndPoiAsync(tourId, poiId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException("TourPoi", $"{tourId}/{poiId}");

        var tour = await _uow.Tours.GetByIdAsync(tourId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), tourId);

        _uow.TourPois.Delete(tourPoi);
        TouchTour(tour);
        _uow.Tours.Update(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task ReorderPoisAsync(
        int tourId,
        ReorderTourPoisRequest request,
        CancellationToken cancellationToken = default)
    {
        var tour = await _uow.Tours.GetByIdAsync(tourId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), tourId);

        if (request.Items.Count == 0)
            throw new ValidationException(nameof(request.Items), "At least one POI order item is required.");

        var duplicatedPoiIds = request.Items
            .GroupBy(i => i.POIId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToArray();

        if (duplicatedPoiIds.Length > 0)
        {
            throw new ValidationException(
                nameof(request.Items),
                $"Duplicate POI ids are not allowed: {string.Join(", ", duplicatedPoiIds)}.");
        }

        var tourPois = await _uow.TourPois.GetByTourIdAsync(tourId, cancellationToken).ConfigureAwait(false);
        var orderMap = request.Items.ToDictionary(i => i.POIId, i => i.OrderIndex);
        var existingPoiIds = tourPois.Select(tp => tp.POIId).ToHashSet();
        var missingPoiIds = orderMap.Keys.Where(poiId => !existingPoiIds.Contains(poiId)).ToArray();

        if (missingPoiIds.Length > 0)
        {
            throw new ValidationException(
                nameof(request.Items),
                $"POI ids are not on this tour: {string.Join(", ", missingPoiIds)}.");
        }

        foreach (var tourPoi in tourPois)
        {
            if (orderMap.TryGetValue(tourPoi.POIId, out var order))
            {
                tourPoi.OrderIndex = order;
                _uow.TourPois.Update(tourPoi);
            }
        }

        TouchTour(tour);
        _uow.Tours.Update(tour);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static void TouchTour(Tour tour)
    {
        tour.Version++;
        tour.UpdatedAt = DateTime.UtcNow;
    }

    private static void ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ValidationException(nameof(CreateTourRequest.Code), "Tour code is required.");
        }
    }

    private static void ValidateEstimatedMinutes(int? estimatedMinutes)
    {
        if (estimatedMinutes.HasValue && estimatedMinutes.Value < 0)
        {
            throw new ValidationException(nameof(CreateTourRequest.EstimatedMinutes), "Estimated minutes must be zero or greater.");
        }
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

    private static PublicTourDto MapPublicTour(Tour tour)
    {
        return new PublicTourDto
        {
            Id = tour.Id,
            Code = tour.Code,
            DefaultLanguage = tour.DefaultLanguage,
            EstimatedMinutes = tour.EstimatedMinutes,
            Translations = tour.Translations
                .OrderBy(t => t.LanguageCode == tour.DefaultLanguage ? 0 : 1)
                .ThenBy(t => t.LanguageCode)
                .Select(t => new TourTranslationDto
                {
                    Id = t.Id,
                    TourId = t.TourId,
                    LanguageCode = t.LanguageCode,
                    Name = t.Name,
                    Description = t.Description
                })
                .ToArray(),
            Pois = tour.TourPois
                .OrderBy(tp => tp.OrderIndex)
                .Select(MapPublicTourPoi)
                .ToArray()
        };
    }

    private static PublicTourPoiDto MapPublicTourPoi(TourPoi tourPoi)
    {
        var poi = tourPoi.Poi;
        var translation = poi.Translations
            .OrderBy(t => t.LanguageCode == "vi" ? 0 : 1)
            .ThenBy(t => t.LanguageCode)
            .FirstOrDefault();

        return new PublicTourPoiDto
        {
            Id = tourPoi.Id,
            TourId = tourPoi.TourId,
            POIId = tourPoi.POIId,
            PoiCode = poi.Code,
            PoiName = translation?.Name ?? poi.Code,
            PoiDescription = translation?.Description,
            PoiShortDescription = translation?.ShortDescription,
            Latitude = poi.Latitude,
            Longitude = poi.Longitude,
            ImageUrl = poi.ImageUrl,
            Category = poi.Category,
            HasAudio = poi.AudioTracks.Any(a => a.DeletedAt == null && a.IsActive),
            OrderIndex = tourPoi.OrderIndex
        };
    }
}
