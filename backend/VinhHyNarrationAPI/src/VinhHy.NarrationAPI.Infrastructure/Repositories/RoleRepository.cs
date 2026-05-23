using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly ApplicationDbContext _db;

    public RoleRepository(ApplicationDbContext db) => _db = db;

    public async Task<Role?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _db.Roles.FindAsync([id], cancellationToken).ConfigureAwait(false);

    public async Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default) =>
        await _db.Roles.FirstOrDefaultAsync(r => r.Name == name, cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<Role>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _db.Roles.OrderBy(r => r.Name).ToListAsync(cancellationToken).ConfigureAwait(false);

    public async Task AddAsync(Role role, CancellationToken cancellationToken = default) =>
        await _db.Roles.AddAsync(role, cancellationToken).ConfigureAwait(false);

    public void Update(Role role) => _db.Roles.Update(role);

    public void Delete(Role role) => _db.Roles.Remove(role);
}
