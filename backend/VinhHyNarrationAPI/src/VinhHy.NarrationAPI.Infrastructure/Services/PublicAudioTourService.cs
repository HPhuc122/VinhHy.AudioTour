using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.PublicAudioTour.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Domain.Specifications;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PublicAudioTourService : IPublicAudioTourService
{
    private readonly IUnitOfWork _uow;
    private readonly IPublicAccessService _publicAccessService;

    public PublicAudioTourService(IUnitOfWork uow, IPublicAccessService publicAccessService)
    {
        _uow = uow;
        _publicAccessService = publicAccessService;
    }

    public async Task<PublicAudioTourTourDto> GetTourAsync(
        string? accessToken,
        int tourId,
        string languageCode = "vi",
        CancellationToken cancellationToken = default)
    {
        await _publicAccessService.ValidateAccessForTourAsync(accessToken, tourId, cancellationToken)
            .ConfigureAwait(false);

        var tour = await _uow.Tours.GetByIdAsync(tourId, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Tour", tourId);

        var now = DateTime.UtcNow;
        var translation = SelectTourTranslation(tour, languageCode);

        return new PublicAudioTourTourDto
        {
            Id = tour.Id,
            Code = tour.Code,
            Name = translation?.Name ?? tour.Code,
            Description = translation?.Description,
            DefaultLanguage = tour.DefaultLanguage,
            EstimatedMinutes = tour.EstimatedMinutes,
            Pois = PoiAvailability
                .GetPubliclyAvailableTourPois(tour.TourPois, now)
                .Select(tp => MapPoi(tp.Poi, languageCode, tp.OrderIndex))
                .ToArray()
        };
    }

    public async Task<PublicAudioTourPoiDto> GetPoiAsync(
        string? accessToken,
        int poiId,
        string languageCode = "vi",
        CancellationToken cancellationToken = default)
    {
        await _publicAccessService.ValidateAccessForPoiAsync(accessToken, poiId, cancellationToken)
            .ConfigureAwait(false);

        var poi = await _uow.Pois.GetByIdAsync(poiId, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("POI", poiId);

        if (!PoiAvailability.IsPubliclyAvailable(poi, DateTime.UtcNow))
        {
            throw new NotFoundException("POI", poiId);
        }

        var audioTracks = await _uow.AudioTracks.GetByPoiIdAsync(poiId, cancellationToken)
            .ConfigureAwait(false);

        return MapPoi(poi, languageCode, orderIndex: 0, audioTracks);
    }

    private static PublicAudioTourPoiDto MapPoi(
        Poi poi,
        string languageCode,
        int orderIndex,
        IReadOnlyList<AudioTrack>? explicitAudioTracks = null)
    {
        var translation = SelectPoiTranslation(poi, languageCode);
        var audioTracks = explicitAudioTracks ?? poi.AudioTracks.ToArray();

        return new PublicAudioTourPoiDto
        {
            Id = poi.Id,
            Code = poi.Code,
            Name = translation?.Name ?? poi.Code,
            ShortDescription = translation?.ShortDescription,
            NarrationText = translation?.Description,
            Latitude = poi.Latitude,
            Longitude = poi.Longitude,
            ImageUrl = poi.ImageUrl,
            Category = poi.Category,
            OrderIndex = orderIndex,
            AudioTracks = audioTracks
                .Where(track => track.IsActive && track.DeletedAt == null)
                .OrderBy(track => track.LanguageCode == languageCode ? 0 : 1)
                .ThenBy(track => track.LanguageCode)
                .Select(track => MapAudio(track, translation?.Name ?? poi.Code))
                .ToArray()
        };
    }

    private static PublicAudioTourAudioDto MapAudio(AudioTrack track, string poiName) =>
        new()
        {
            Id = track.Id,
            AudioTrackId = track.Id,
            LanguageCode = track.LanguageCode,
            Language = track.LanguageCode,
            Title = string.IsNullOrWhiteSpace(track.Title) ? $"{poiName} - {track.LanguageCode}" : track.Title,
            AudioType = track.AudioType,
            DurationSeconds = track.DurationSeconds,
            Duration = track.DurationSeconds,
            FileSizeBytes = track.FileSizeBytes,
            MimeType = track.MimeType,
            IsAvailable = !string.IsNullOrWhiteSpace(track.FileUrl)
        };

    private static TourTranslation? SelectTourTranslation(Tour tour, string languageCode) =>
        tour.Translations
            .OrderBy(t => t.LanguageCode == languageCode ? 0 : t.LanguageCode == tour.DefaultLanguage ? 1 : 2)
            .ThenBy(t => t.LanguageCode)
            .FirstOrDefault();

    private static PoiTranslation? SelectPoiTranslation(Poi poi, string languageCode) =>
        poi.Translations
            .OrderBy(t => t.LanguageCode == languageCode ? 0 : t.LanguageCode == "vi" ? 1 : 2)
            .ThenBy(t => t.LanguageCode)
            .FirstOrDefault();
}
