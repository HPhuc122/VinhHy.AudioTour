using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Common;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class SoftDeleteService
{
    private readonly IDeletedRecordRepository _deletedRecords;

    public SoftDeleteService(IDeletedRecordRepository deletedRecords) =>
        _deletedRecords = deletedRecords;

    public async Task SoftDeleteAsync<T>(
        T entity,
        string entityType,
        int? deletedBy = null,
        CancellationToken cancellationToken = default)
        where T : class, ISoftDeletable
    {
        var now = DateTime.UtcNow;
        entity.DeletedAt = now;

        if (entity is IVersionedEntity versioned)
            versioned.Version++;

        switch (entity)
        {
            case Poi poi:
                poi.UpdatedAt = now;
                break;
            case AudioTrack track:
                track.UpdatedAt = now;
                break;
            case Tour tour:
                tour.UpdatedAt = now;
                break;
        }

        var entityId = entity switch
        {
            Poi p => p.Id,
            AudioTrack a => a.Id,
            Tour t => t.Id,
            QrLocation q => q.Id,
            _ => throw new InvalidOperationException($"Unsupported soft-delete type: {typeof(T).Name}")
        };

        await _deletedRecords.AddAsync(
            new DeletedRecord
            {
                EntityType = entityType,
                EntityId = entityId,
                DeletedAt = now,
                DeletedBy = deletedBy
            },
            cancellationToken).ConfigureAwait(false);
    }

    public static string GetEntityType<T>() where T : class =>
        typeof(T).Name switch
        {
            nameof(Poi) => SyncEntityTypes.POI,
            nameof(AudioTrack) => SyncEntityTypes.AudioTrack,
            nameof(Tour) => SyncEntityTypes.Tour,
            nameof(QrLocation) => SyncEntityTypes.QRLocation,
            _ => typeof(T).Name
        };
}
