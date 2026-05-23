using VinhHy.AudioTour.Mobile.Core.Contracts;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IAudioPlaybackService
{
    bool IsPlaying { get; }

    Task PlayAsync(AudioPlaybackRequest request, CancellationToken cancellationToken = default);

    Task StopAsync(CancellationToken cancellationToken = default);
}
