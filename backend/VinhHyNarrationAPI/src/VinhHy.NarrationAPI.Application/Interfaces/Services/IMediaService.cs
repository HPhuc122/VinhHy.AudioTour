using VinhHy.NarrationAPI.Application.Features.Media.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IMediaService
{
    Task<IReadOnlyList<MediaFileDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<MediaFileDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<MediaFileDto> UploadAsync(UploadMediaRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
