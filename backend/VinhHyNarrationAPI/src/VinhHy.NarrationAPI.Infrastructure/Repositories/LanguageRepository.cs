using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class LanguageRepository : ILanguageRepository
{
    private readonly ApplicationDbContext _db;

    public LanguageRepository(ApplicationDbContext db) => _db = db;

    public async Task<Language?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        await _db.Languages.FindAsync([code], cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<Language>> GetAllAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        // If caller requests all records (activeOnly == false) we must bypass any global query filters
        // (e.g., if ApplicationDbContext configured a global filter on IsActive). Use IgnoreQueryFilters()
        // to ensure inactive records are returned as well.
        IQueryable<Language> query = activeOnly
            ? _db.Languages.AsQueryable()
            : _db.Languages.IgnoreQueryFilters();

        if (activeOnly)
        {
            // Apply explicit IsActive filter when caller wants active-only results
            query = query.Where(l => l.IsActive);
        }

        return await query.OrderBy(l => l.SortOrder).ToListAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task AddAsync(Language language, CancellationToken cancellationToken = default) =>
        await _db.Languages.AddAsync(language, cancellationToken).ConfigureAwait(false);

    public void Update(Language language) => _db.Languages.Update(language);

    public void Delete(Language language) => _db.Languages.Remove(language);
}
