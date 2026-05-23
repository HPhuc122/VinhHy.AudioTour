using Plugin.Maui.Audio;
using VinhHy.AudioTour.Mobile.Core.Contracts;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Services;

/// <summary>
/// Wraps Plugin.Maui.Audio for offline file playback. TTS/geofence queue integration comes later.
/// </summary>
public sealed class AudioPlaybackService : IAudioPlaybackService
{
    private readonly IAudioManager _audioManager;
    private IAudioPlayer? _player;

    public AudioPlaybackService()
    {
        _audioManager = AudioManager.Current;
    }

    public bool IsPlaying => _player?.IsPlaying ?? false;

    public async Task PlayAsync(AudioPlaybackRequest request, CancellationToken cancellationToken = default)
    {
        await StopAsync(cancellationToken).ConfigureAwait(false);

        if (!string.IsNullOrWhiteSpace(request.LocalFilePath) && File.Exists(request.LocalFilePath))
        {
            _player = _audioManager.CreatePlayer(await File.OpenReadAsync(request.LocalFilePath, cancellationToken)
                .ConfigureAwait(false));
        }
        else if (!string.IsNullOrWhiteSpace(request.RemoteFileUrl))
        {
            using var http = new HttpClient();
            var stream = await http.GetStreamAsync(request.RemoteFileUrl, cancellationToken).ConfigureAwait(false);
            _player = _audioManager.CreatePlayer(stream);
        }
        else
        {
            return;
        }

        _player.Play();
    }

    public Task StopAsync(CancellationToken cancellationToken = default)
    {
        if (_player is null)
        {
            return Task.CompletedTask;
        }

        _player.Stop();
        _player.Dispose();
        _player = null;
        return Task.CompletedTask;
    }
}
