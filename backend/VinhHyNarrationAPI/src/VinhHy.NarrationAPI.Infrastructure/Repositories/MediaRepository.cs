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
            .OrderByDescending(m => m.UploadedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<MediaFile?> GetByIdAsync(
        int id,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default) =>
        await Query(includeDeleted)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(MediaFile mediaFile, CancellationToken cancellationToken = default) =>
        await _db.MediaFiles.AddAsync(mediaFile, cancellationToken).ConfigureAwait(false);

    public void Update(MediaFile mediaFile) => _db.MediaFiles.Update(mediaFile);
}
