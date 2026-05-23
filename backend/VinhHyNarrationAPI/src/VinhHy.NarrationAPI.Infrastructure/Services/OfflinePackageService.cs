using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.OfflinePackages.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class OfflinePackageService : IOfflinePackageService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public OfflinePackageService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<OfflinePackageDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var package = await _uow.OfflinePackages.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return package is null ? null : _mapper.Map<OfflinePackageDto>(package);
    }

    public async Task<OfflinePackageDto?> GetLatestAsync(
        int tourId,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        var package = await _uow.OfflinePackages
            .GetLatestActiveAsync(tourId, languageCode, cancellationToken)
            .ConfigureAwait(false);
        return package is null ? null : _mapper.Map<OfflinePackageDto>(package);
    }

    public async Task<IReadOnlyList<OfflinePackageDto>> GetByTourIdAsync(
        int tourId,
        CancellationToken cancellationToken = default)
    {
        var packages = await _uow.OfflinePackages.GetByTourIdAsync(tourId, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<OfflinePackageDto>>(packages);
    }

    public async Task<OfflinePackageDto> CreateAsync(
        CreateOfflinePackageRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = await _uow.Tours.GetByIdAsync(request.TourId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Tour), request.TourId);

        var package = _mapper.Map<OfflinePackage>(request);
        package.PublishedAt = DateTime.UtcNow;

        await _uow.OfflinePackages.AddAsync(package, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<OfflinePackageDto>(package);
    }

    public async Task<OfflinePackageDto> UpdateAsync(
        int id,
        UpdateOfflinePackageRequest request,
        CancellationToken cancellationToken = default)
    {
        var package = await _uow.OfflinePackages.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(OfflinePackage), id);

        if (request.DownloadUrl is not null) package.DownloadUrl = request.DownloadUrl;
        if (request.FileSizeBytes.HasValue) package.FileSizeBytes = request.FileSizeBytes.Value;
        if (request.Checksum is not null) package.Checksum = request.Checksum;
        if (request.IsActive.HasValue) package.IsActive = request.IsActive.Value;

        _uow.OfflinePackages.Update(package);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<OfflinePackageDto>(package);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var package = await _uow.OfflinePackages.GetByIdAsync(id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(OfflinePackage), id);

        _uow.OfflinePackages.Delete(package);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
