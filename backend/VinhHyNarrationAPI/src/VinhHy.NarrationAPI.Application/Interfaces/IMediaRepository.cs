using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IMediaRepository
{
    Task<IReadOnlyList<MediaFile>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<MediaFile> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? fileType = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default);

    Task<int> CountAsync(
        string? fileType = null,
        bool? isDeleted = false,
        CancellationToken cancellationToken = default);

    Task<MediaFile?> GetByIdAsync(int id, bool includeDeleted = false, CancellationToken cancellationToken = default);

    Task AddAsync(MediaFile mediaFile, CancellationToken cancellationToken = default);

    void Update(MediaFile mediaFile);
}
