using VinhHy.NarrationAPI.Application.Features.OfflinePackages.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IOfflinePackageService
{
    Task<OfflinePackageDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<OfflinePackageDto?> GetLatestAsync(int tourId, string languageCode, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OfflinePackageDto>> GetByTourIdAsync(int tourId, CancellationToken cancellationToken = default);

    Task<OfflinePackageDto> CreateAsync(CreateOfflinePackageRequest request, CancellationToken cancellationToken = default);

    Task<OfflinePackageDto> UpdateAsync(int id, UpdateOfflinePackageRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
