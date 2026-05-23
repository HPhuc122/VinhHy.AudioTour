using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class DeletedRecordRepository : IDeletedRecordRepository
{
    private readonly ApplicationDbContext _db;

    public DeletedRecordRepository(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<DeletedRecord>> GetSinceAsync(
        DateTime since,
        IReadOnlyList<string>? entityTypes = null,
        CancellationToken cancellationToken = default)
    {
        var query = _db.DeletedRecords.Where(d => d.DeletedAt >= since);

        if (entityTypes is { Count: > 0 })
            query = query.Where(d => entityTypes.Contains(d.EntityType));

        return await query
            .OrderByDescending(d => d.DeletedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task AddAsync(DeletedRecord record, CancellationToken cancellationToken = default) =>
        await _db.DeletedRecords.AddAsync(record, cancellationToken).ConfigureAwait(false);
}
