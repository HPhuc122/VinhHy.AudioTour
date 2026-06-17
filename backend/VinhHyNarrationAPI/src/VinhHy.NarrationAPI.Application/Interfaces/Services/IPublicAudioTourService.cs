using VinhHy.NarrationAPI.Application.Features.PublicAudioTour.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPublicAudioTourService
{
    Task<PublicAudioTourTourDto> GetTourAsync(
        string? accessToken,
        int tourId,
        string languageCode = "vi",
        CancellationToken cancellationToken = default);

    Task<PublicAudioTourPoiDto> GetPoiAsync(
        string? accessToken,
        int poiId,
        string languageCode = "vi",
        CancellationToken cancellationToken = default);
}
