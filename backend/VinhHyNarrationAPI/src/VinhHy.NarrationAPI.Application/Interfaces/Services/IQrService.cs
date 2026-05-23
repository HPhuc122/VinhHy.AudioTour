using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IQrService
{
    Task<QrLocationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<QrResolveResponse?> ResolveAsync(string qrCode, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QrLocationDto>> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);

    Task<QrLocationDto> CreateAsync(CreateQrLocationRequest request, CancellationToken cancellationToken = default);

    Task<QrLocationDto> UpdateAsync(int id, UpdateQrLocationRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
