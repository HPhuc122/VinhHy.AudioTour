using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class SyncRepository : ISyncRepository
{
    private readonly ApplicationDbContext _db;

    public SyncRepository(ApplicationDbContext db) => _db = db;

    public async Task AddHistoryAsync(SyncHistory history, CancellationToken cancellationToken = default) =>
        await _db.SyncHistory.AddAsync(history, cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<SyncHistory>> GetHistoryByUserAsync(
        int userId,
        int take,
        CancellationToken cancellationToken = default) =>
        await _db.SyncHistory
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.SyncedAt)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
}
