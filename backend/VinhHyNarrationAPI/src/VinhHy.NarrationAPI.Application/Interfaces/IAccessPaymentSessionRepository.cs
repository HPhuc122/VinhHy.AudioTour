using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IAccessPaymentSessionRepository
{
    Task<AccessPaymentSession?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task AddAsync(AccessPaymentSession session, CancellationToken cancellationToken = default);

    void Update(AccessPaymentSession session);
}
