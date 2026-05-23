using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IDeletedRecordRepository
{
    Task<IReadOnlyList<DeletedRecord>> GetSinceAsync(
        DateTime since,
        IReadOnlyList<string>? entityTypes = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(DeletedRecord record, CancellationToken cancellationToken = default);
}
