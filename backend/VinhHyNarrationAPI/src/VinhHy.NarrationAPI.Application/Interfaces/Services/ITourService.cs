using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface ITourService
{
    Task<TourDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<PagedResult<TourDto>> GetPagedAsync(
        TourListFilter filter,
        CancellationToken cancellationToken = default);

    Task<PublicTourDto?> GetPublicByIdAsync(
        int id,
        string? languageCode = null,
        CancellationToken cancellationToken = default);

    Task<PagedResult<PublicTourDto>> GetPublicPagedAsync(
        TourListFilter filter,
        string? languageCode = null,
        CancellationToken cancellationToken = default);

    Task<TourDto> CreateAsync(CreateTourRequest request, CancellationToken cancellationToken = default);

    Task<TourDto> UpdateAsync(int id, UpdateTourRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<TourTranslationDto> AddTranslationAsync(
        int tourId,
        CreateTourTranslationRequest request,
        CancellationToken cancellationToken = default);

    Task<TourTranslationDto> UpdateTranslationAsync(
        int translationId,
        UpdateTourTranslationRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteTranslationAsync(int translationId, CancellationToken cancellationToken = default);

    Task<TourPoiDto> AddPoiAsync(int tourId, AddTourPoiRequest request, CancellationToken cancellationToken = default);

    Task RemovePoiAsync(int tourId, int poiId, CancellationToken cancellationToken = default);

    Task ReorderPoisAsync(int tourId, ReorderTourPoisRequest request, CancellationToken cancellationToken = default);
}
