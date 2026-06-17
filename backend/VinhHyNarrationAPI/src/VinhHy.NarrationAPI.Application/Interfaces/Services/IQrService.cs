using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IQrService
{
    Task<IReadOnlyList<QrDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<QrDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<QrDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<QrResolveResponse?> ResolveAsync(string code, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QrDto>> GetPublicPackagesAsync(CancellationToken cancellationToken = default);

    Task<QrDto> CreateAsync(CreateQrRequest request, CancellationToken cancellationToken = default);

    Task<QrDto> UpdateAsync(int id, UpdateQrRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
