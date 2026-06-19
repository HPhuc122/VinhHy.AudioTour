using VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPublicAccessService
{
    Task<StartAccessResponse> StartAsync(StartAccessRequest request, CancellationToken cancellationToken = default);

    Task<SimulatePaymentResponse> SimulatePaymentAsync(
        SimulatePaymentRequest request,
        CancellationToken cancellationToken = default);

    Task<ValidateAccessResponse> ValidateAsync(string? accessToken, CancellationToken cancellationToken = default);

    Task<ValidateAccessResponse> ValidateAccessForTourAsync(
        string? accessToken,
        int tourId,
        CancellationToken cancellationToken = default);

    Task<ValidateAccessResponse> ValidateAccessForPoiAsync(
        string? accessToken,
        int poiId,
        CancellationToken cancellationToken = default);

    Task<ValidateAccessResponse> ValidateAccessForAudioTrackAsync(
        string? accessToken,
        int audioTrackId,
        CancellationToken cancellationToken = default);
}
