using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPoiTranslationService
{
    Task<PoiTranslationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PoiTranslationDto>> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);

    Task<PoiTranslationDto> CreateAsync(CreatePoiTranslationRequest request, CancellationToken cancellationToken = default);

    Task<PoiTranslationDto> UpdateAsync(int id, UpdatePoiTranslationRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
