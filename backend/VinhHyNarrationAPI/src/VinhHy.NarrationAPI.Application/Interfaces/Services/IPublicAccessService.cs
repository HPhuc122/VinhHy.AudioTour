using VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPublicAccessService
{
    Task<StartAccessResponse> StartAsync(StartAccessRequest request, CancellationToken cancellationToken = default);

    Task<SimulatePaymentResponse> SimulatePaymentAsync(
        SimulatePaymentRequest request,
        CancellationToken cancellationToken = default);

    Task<ValidateAccessResponse> ValidateAsync(string? accessToken, CancellationToken cancellationToken = default);
}
