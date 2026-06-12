using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class MediaRepository : IMediaRepository
{
    private readonly ApplicationDbContext _db;

    public MediaRepository(ApplicationDbContext db) => _db = db;

    private IQueryable<MediaFile> Query(bool includeDeleted) =>
        includeDeleted ? _db.MediaFiles : _db.MediaFiles.Where(m => !m.IsDeleted);

    public async Task<IReadOnlyList<MediaFile>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Query(includeDeleted: false)
            .AsNoTracking()
            .Include(m => m.UploadedByUser)
            .OrderByDescending(m => m.UploadedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<(IReadOnlyList<MediaFile> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? fileType = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<MediaFile> query = Query(includeDeleted)
            .AsNoTracking()
            .Include(m => m.UploadedByUser);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(m =>
                m.FileName.Contains(keyword) ||
                m.OriginalFileName.Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(fileType))
        {
            query = query.Where(m => m.FileType == fileType);
        }

        var total = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderByDescending(m => m.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return (items, total);
    }

    public async Task<int> CountAsync(
        string? fileType = null,
        bool? isDeleted = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<MediaFile> query = _db.MediaFiles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(fileType))
        {
            query = query.Where(m => m.FileType == fileType);
        }

        if (isDeleted.HasValue)
        {
            query = query.Where(m => m.IsDeleted == isDeleted.Value);
        }

        return await query.CountAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<MediaFile?> GetByIdAsync(
        int id,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default) =>
        await Query(includeDeleted)
            .Include(m => m.UploadedByUser)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(MediaFile mediaFile, CancellationToken cancellationToken = default) =>
        await _db.MediaFiles.AddAsync(mediaFile, cancellationToken).ConfigureAwait(false);

    public void Update(MediaFile mediaFile) => _db.MediaFiles.Update(mediaFile);
}
