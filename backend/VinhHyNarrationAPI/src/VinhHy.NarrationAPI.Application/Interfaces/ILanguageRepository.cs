using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface ILanguageRepository
{
    Task<Language?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Language>> GetAllAsync(bool activeOnly = true, CancellationToken cancellationToken = default);

    Task AddAsync(Language language, CancellationToken cancellationToken = default);

    void Update(Language language);

    void Delete(Language language);
}
