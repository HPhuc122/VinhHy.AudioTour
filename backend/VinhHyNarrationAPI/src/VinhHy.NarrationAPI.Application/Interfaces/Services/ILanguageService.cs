using VinhHy.NarrationAPI.Application.Features.Languages.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface ILanguageService
{
    Task<IReadOnlyList<LanguageDto>> GetAllAsync(bool activeOnly = true, CancellationToken cancellationToken = default);

    Task<LanguageDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
}
