using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class TourPoiRepository : ITourPoiRepository
{
    private readonly ApplicationDbContext _db;

    public TourPoiRepository(ApplicationDbContext db) => _db = db;

    public async Task<TourPoi?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _db.TourPois
            .Include(tp => tp.Poi)
            .FirstOrDefaultAsync(tp => tp.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<TourPoi>> GetByTourIdAsync(
        int tourId,
        CancellationToken cancellationToken = default) =>
        await _db.TourPois
            .Include(tp => tp.Poi)
            .Where(tp => tp.TourId == tourId)
            .OrderBy(tp => tp.OrderIndex)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<TourPoi?> GetByTourAndPoiAsync(
        int tourId,
        int poiId,
        CancellationToken cancellationToken = default) =>
        await _db.TourPois
            .FirstOrDefaultAsync(tp => tp.TourId == tourId && tp.POIId == poiId, cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(TourPoi tourPoi, CancellationToken cancellationToken = default) =>
        await _db.TourPois.AddAsync(tourPoi, cancellationToken).ConfigureAwait(false);

    public void Update(TourPoi tourPoi) => _db.TourPois.Update(tourPoi);

    public void Delete(TourPoi tourPoi) => _db.TourPois.Remove(tourPoi);
}
