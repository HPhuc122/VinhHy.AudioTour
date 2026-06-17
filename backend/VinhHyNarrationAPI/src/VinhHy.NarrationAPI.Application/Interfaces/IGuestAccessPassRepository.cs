using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IGuestAccessPassRepository
{
    Task<GuestAccessPass?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<GuestAccessPass?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);

    Task AddAsync(GuestAccessPass pass, CancellationToken cancellationToken = default);

    void Update(GuestAccessPass pass);
}
