using VinhHy.NarrationAPI.Application.Features.Audio.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IAudioService
{
    Task<AudioTrackDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AudioTrackDto>> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);

    Task<AudioTrackDto> CreateAsync(CreateAudioTrackRequest request, CancellationToken cancellationToken = default);

    Task<AudioTrackDto> UpdateAsync(int id, UpdateAudioTrackRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
