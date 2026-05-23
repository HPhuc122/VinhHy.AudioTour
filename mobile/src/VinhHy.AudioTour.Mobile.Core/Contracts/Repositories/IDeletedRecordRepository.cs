using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IDeletedRecordRepository
{
    Task InsertRangeAsync(IEnumerable<DeletedRecordLocal> records, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DeletedRecordLocal>> GetUnprocessedAsync(CancellationToken cancellationToken = default);

    Task MarkProcessedAsync(
        IEnumerable<long> ids,
        DateTime processedAt,
        CancellationToken cancellationToken = default);
}
