using VinhHy.NarrationAPI.Application.Features.Languages.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface ILanguageService
{
    Task<IReadOnlyList<LanguageDto>> GetAllAsync(bool activeOnly = true, CancellationToken cancellationToken = default);
    Task<LanguageDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<LanguageDto> CreateAsync(CreateLanguageRequest request, CancellationToken cancellationToken = default);
    Task<LanguageDto> UpdateAsync(string code, UpdateLanguageRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(string code, CancellationToken cancellationToken = default);
}
