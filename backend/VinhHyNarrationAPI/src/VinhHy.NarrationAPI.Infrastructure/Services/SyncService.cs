using AutoMapper;
using VinhHy.NarrationAPI.Application.Features.Sync.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class SyncService : ISyncService
{
    private static readonly DateTime Epoch = DateTime.UnixEpoch;

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public SyncService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<SyncPullResponse> PullAsync(
        SyncPullRequest request,
        CancellationToken cancellationToken = default)
    {
        var since = request.Since ?? Epoch;
        var types = request.EntityTypes?.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var response = new SyncPullResponse
        {
            ServerTimestamp = DateTime.UtcNow
        };

        if (ShouldInclude(types, SyncEntityTypes.POI))
        {
            var pois = await _uow.Pois.GetChangedSinceAsync(since, cancellationToken).ConfigureAwait(false);
            response.Pois = _mapper.Map<IReadOnlyList<SyncablePoiDto>>(pois);
        }

        if (ShouldInclude(types, SyncEntityTypes.POITranslation))
        {
            var translations = await _uow.PoiTranslations.GetChangedSinceAsync(since, cancellationToken).ConfigureAwait(false);
            response.PoiTranslations = _mapper.Map<IReadOnlyList<SyncablePoiTranslationDto>>(translations);
        }

        if (ShouldInclude(types, SyncEntityTypes.AudioTrack))
        {
            var tracks = await _uow.AudioTracks.GetChangedSinceAsync(since, cancellationToken).ConfigureAwait(false);
            response.AudioTracks = _mapper.Map<IReadOnlyList<SyncableAudioTrackDto>>(tracks);
        }

        if (ShouldInclude(types, SyncEntityTypes.Tour))
        {
            var tours = await _uow.Tours.GetChangedSinceAsync(since, cancellationToken).ConfigureAwait(false);
            response.Tours = _mapper.Map<IReadOnlyList<SyncableTourDto>>(tours);
        }

        if (ShouldInclude(types, SyncEntityTypes.TourTranslation))
        {
            var tourTranslations = await _uow.TourTranslations.GetChangedSinceAsync(since, cancellationToken).ConfigureAwait(false);
            response.TourTranslations = _mapper.Map<IReadOnlyList<SyncableTourTranslationDto>>(tourTranslations);
        }

        if (ShouldInclude(types, SyncEntityTypes.QRLocation))
        {
            var qrLocations = await _uow.QrLocations.GetChangedSinceAsync(since, cancellationToken).ConfigureAwait(false);
            response.QrLocations = _mapper.Map<IReadOnlyList<SyncableQrLocationDto>>(qrLocations);
        }

        if (ShouldInclude(types, SyncEntityTypes.Language))
        {
            var languages = await _uow.Languages.GetAllAsync(activeOnly: false, cancellationToken).ConfigureAwait(false);
            response.Languages = _mapper.Map<IReadOnlyList<SyncableLanguageDto>>(languages);
        }

        if (ShouldInclude(types, SyncEntityTypes.OfflinePackage))
        {
            var packages = await _uow.OfflinePackages.GetChangedSinceAsync(since, cancellationToken).ConfigureAwait(false);
            response.OfflinePackages = _mapper.Map<IReadOnlyList<SyncableOfflinePackageDto>>(packages);
        }

        var tombstoneTypes = types is null
            ? null
            : types.Where(t => t != SyncEntityTypes.Language && t != SyncEntityTypes.OfflinePackage).ToList();

        var deleted = await _uow.DeletedRecords
            .GetSinceAsync(since, tombstoneTypes, cancellationToken)
            .ConfigureAwait(false);
        response.DeletedRecords = _mapper.Map<IReadOnlyList<DeletedRecordDto>>(deleted);

        return response;
    }

    public async Task<SyncPushResponse> PushAsync(
        SyncPushRequest request,
        CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var accepted = 0;
        var rejected = 0;
        var logs = new List<NarrationLog>();

        foreach (var item in request.NarrationLogs)
        {
            try
            {
                if (await _uow.Pois.GetByIdAsync(item.POIId, includeDeleted: true, cancellationToken).ConfigureAwait(false) is null)
                {
                    errors.Add($"POI {item.POIId} not found.");
                    rejected++;
                    continue;
                }

                var log = _mapper.Map<NarrationLog>(item);
                log.UserId = request.UserId > 0 ? request.UserId : null;
                log.DeviceId = request.DeviceId ?? item.DeviceId;
                log.Synced = true;
                logs.Add(log);
                accepted++;
            }
            catch (Exception ex)
            {
                errors.Add(ex.Message);
                rejected++;
            }
        }

        if (logs.Count > 0)
            await _uow.NarrationLogs.AddRangeAsync(logs, cancellationToken).ConfigureAwait(false);

        await _uow.Sync.AddHistoryAsync(
            new SyncHistory
            {
                UserId = request.UserId,
                DeviceId = request.DeviceId,
                SyncType = "push",
                SyncedAt = DateTime.UtcNow,
                RecordsIn = request.NarrationLogs.Count,
                RecordsOut = 0,
                Success = rejected == 0,
                ErrorMessage = errors.Count > 0 ? string.Join("; ", errors) : null
            },
            cancellationToken).ConfigureAwait(false);

        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new SyncPushResponse
        {
            RecordsAccepted = accepted,
            RecordsRejected = rejected,
            ServerTimestamp = DateTime.UtcNow,
            Errors = errors
        };
    }

    private static bool ShouldInclude(HashSet<string>? types, string entityType) =>
        types is null || types.Contains(entityType);
}
