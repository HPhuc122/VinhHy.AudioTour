using VinhHy.NarrationAPI.Application.Features.Media.DTOs;
using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IMediaService
{
    Task<IReadOnlyList<MediaFileDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<PagedResult<MediaFileDto>> SearchAsync(
        MediaListRequest request,
        Func<string, string>? publicUrlFactory = null,
        CancellationToken cancellationToken = default);

    Task<MediaFileDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<MediaFileDto> UploadAsync(UploadMediaRequest request, CancellationToken cancellationToken = default);

    Task<MediaFileDto> ApproveAsync(int id, int reviewerUserId, CancellationToken cancellationToken = default);

    Task<MediaFileDto> RejectAsync(
        int id,
        int reviewerUserId,
        string reason,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task RestoreAsync(int id, CancellationToken cancellationToken = default);
}
