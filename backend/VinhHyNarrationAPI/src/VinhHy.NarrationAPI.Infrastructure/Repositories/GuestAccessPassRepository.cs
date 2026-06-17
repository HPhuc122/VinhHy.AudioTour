using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class GuestAccessPassRepository : IGuestAccessPassRepository
{
    private readonly ApplicationDbContext _db;

    public GuestAccessPassRepository(ApplicationDbContext db) => _db = db;

    public async Task<GuestAccessPass?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default) =>
        await _db.GuestAccessPasses
            .Include(p => p.QrLocation)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task<GuestAccessPass?> GetByTokenHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default) =>
        await _db.GuestAccessPasses
            .Include(p => p.QrLocation)
            .FirstOrDefaultAsync(p => p.TokenHash == tokenHash, cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(GuestAccessPass pass, CancellationToken cancellationToken = default) =>
        await _db.GuestAccessPasses.AddAsync(pass, cancellationToken).ConfigureAwait(false);

    public void Update(GuestAccessPass pass) => _db.GuestAccessPasses.Update(pass);
}
