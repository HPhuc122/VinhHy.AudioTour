using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Audio.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class AudioService : IAudioService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly SoftDeleteService _softDelete;

    public AudioService(IUnitOfWork uow, IMapper mapper, SoftDeleteService softDelete)
    {
        _uow = uow;
        _mapper = mapper;
        _softDelete = softDelete;
    }

    public async Task<AudioTrackDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var track = await _uow.AudioTracks.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return track is null ? null : _mapper.Map<AudioTrackDto>(track);
    }

    public async Task<IReadOnlyList<AudioTrackDto>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default)
    {
        var tracks = await _uow.AudioTracks.GetByPoiIdAsync(poiId, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<AudioTrackDto>>(tracks);
    }

    public async Task<AudioTrackDto> CreateAsync(
        CreateAudioTrackRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = await _uow.Pois.GetByIdAsync(request.POIId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), request.POIId);

        if (await _uow.AudioTracks
                .GetByPoiAndLanguageAsync(request.POIId, request.LanguageCode, cancellationToken)
                .ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.LanguageCode), "Audio track for this language already exists.");

        var now = DateTime.UtcNow;
        var track = _mapper.Map<AudioTrack>(request);
        track.CreatedAt = now;
        track.UpdatedAt = now;

        await _uow.AudioTracks.AddAsync(track, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<AudioTrackDto>(track);
    }

    public async Task<AudioTrackDto> UpdateAsync(
        int id,
        UpdateAudioTrackRequest request,
        CancellationToken cancellationToken = default)
    {
        var track = await _uow.AudioTracks.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(AudioTrack), id);

        if (request.AudioType is not null) track.AudioType = request.AudioType;
        if (request.FileUrl is not null) track.FileUrl = request.FileUrl;
        if (request.TTSText is not null) track.TTSText = request.TTSText;
        if (request.DurationSeconds.HasValue) track.DurationSeconds = request.DurationSeconds;
        if (request.FileSizeBytes.HasValue) track.FileSizeBytes = request.FileSizeBytes;
        if (request.MimeType is not null) track.MimeType = request.MimeType;
        if (request.IsActive.HasValue) track.IsActive = request.IsActive.Value;

        track.Version++;
        track.UpdatedAt = DateTime.UtcNow;
        _uow.AudioTracks.Update(track);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<AudioTrackDto>(track);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var track = await _uow.AudioTracks.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(AudioTrack), id);

        await _softDelete.SoftDeleteAsync(track, SyncEntityTypes.AudioTrack, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        _uow.AudioTracks.SoftDelete(track);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
