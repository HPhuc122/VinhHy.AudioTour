using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class AccessPaymentSessionRepository : IAccessPaymentSessionRepository
{
    private readonly ApplicationDbContext _db;

    public AccessPaymentSessionRepository(ApplicationDbContext db) => _db = db;

    public async Task<AccessPaymentSession?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default) =>
        await _db.AccessPaymentSessions
            .Include(s => s.GuestAccessPass)
            .ThenInclude(p => p.QrLocation)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(AccessPaymentSession session, CancellationToken cancellationToken = default) =>
        await _db.AccessPaymentSessions.AddAsync(session, cancellationToken).ConfigureAwait(false);

    public void Update(AccessPaymentSession session) => _db.AccessPaymentSessions.Update(session);
}
