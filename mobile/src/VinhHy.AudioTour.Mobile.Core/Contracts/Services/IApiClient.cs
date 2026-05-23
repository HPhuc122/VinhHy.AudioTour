using VinhHy.AudioTour.Mobile.Core.Api;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IApiClient
{
    Task<ApiResponse<T>> GetAsync<T>(string path, CancellationToken cancellationToken = default);

    Task<ApiResponse<T>> PostAsync<T>(
        string path,
        object? body,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<T>> PutAsync<T>(
        string path,
        object? body,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<T>> DeleteAsync<T>(string path, CancellationToken cancellationToken = default);
}
