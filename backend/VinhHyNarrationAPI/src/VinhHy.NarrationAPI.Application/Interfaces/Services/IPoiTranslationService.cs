using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPoiTranslationService
{
    Task<PoiTranslationDto?> GetByIdAsync(
        int id,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PoiTranslationDto>> GetByPoiIdAsync(
        int poiId,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default);

    Task<PoiTranslationDto> CreateAsync(
        CreatePoiTranslationRequest request,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default);

    Task<PoiTranslationDto> UpdateAsync(
        int id,
        UpdatePoiTranslationRequest request,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int id,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default);

    Task<GeneratePoiTranslationsResponse> GenerateAsync(
        GeneratePoiTranslationsRequest request,
        int? requesterUserId = null,
        bool requireOwnedPoi = false,
        CancellationToken cancellationToken = default);
}
