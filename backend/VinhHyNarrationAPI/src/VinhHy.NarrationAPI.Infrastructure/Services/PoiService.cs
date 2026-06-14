using AutoMapper;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PoiService : IPoiService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly SoftDeleteService _softDelete;
    private readonly IFileUploadService _fileUploadService;
    private const string PoiUploadDirectory = "uploads/pois";

    public PoiService(IUnitOfWork uow, IMapper mapper, SoftDeleteService softDelete, IFileUploadService fileUploadService)
    {
        _uow = uow;
        _mapper = mapper;
        _softDelete = softDelete;
        _fileUploadService = fileUploadService;
    }

    public async Task<PoiDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return poi is null ? null : _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false);
        return poi is null ? null : _mapper.Map<PoiDto>(poi);
    }

    public async Task<PagedResult<PoiDto>> GetPagedAsync(
        PoiListFilter filter,
        CancellationToken cancellationToken = default)
    {
        // Backwards-compatible wrapper that delegates to new signature
        return await GetPagedAsync(filter.Page, filter.PageSize, filter.Search, filter.Category, filter.IsActive, filter.IncludeDeleted, cancellationToken).ConfigureAwait(false);
    }

    public async Task<PagedResult<PoiDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? category = null,
        bool? isActive = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        // Delegate to repository which already applies filters and supports includeDeleted/IgnoreQueryFilters.
        var (items, total) = await _uow.Pois.GetPagedAsync(page, pageSize, search, category, isActive, includeDeleted, cancellationToken).ConfigureAwait(false);

        return PagedResult<PoiDto>.Create(
            _mapper.Map<IReadOnlyList<PoiDto>>(items),
            page,
            pageSize,
            total);
    }

    public async Task<PoiDto> CreateAsync(
        CreatePoiRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await _uow.Pois.GetByCodeAsync(request.Code, cancellationToken).ConfigureAwait(false) is not null)
            throw new ValidationException(nameof(request.Code), "POI code already exists.");

        // Handle image file upload if provided
        string? imageUrl = null;
        if (request.Image is not null && request.Image.Length > 0)
        {
            imageUrl = await _fileUploadService.SaveFileAsync(request.Image, PoiUploadDirectory, cancellationToken).ConfigureAwait(false);
        }

        var now = DateTime.UtcNow;
        var poi = _mapper.Map<Poi>(request);
        poi.ImageUrl = imageUrl;
        poi.CreatedAt = now;
        poi.UpdatedAt = now;

        await _uow.Pois.AddAsync(poi, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task<PoiDto> UpdateAsync(
        int id,
        UpdatePoiRequest request,
        CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        if (request.Latitude.HasValue) poi.Latitude = request.Latitude.Value;
        if (request.Longitude.HasValue) poi.Longitude = request.Longitude.Value;
        if (request.RadiusMeters.HasValue) poi.RadiusMeters = request.RadiusMeters.Value;
        if (request.Priority.HasValue) poi.Priority = request.Priority.Value;
        if (request.IsActive.HasValue) poi.IsActive = request.IsActive.Value;

        // Handle image file update if provided
        if (request.Image is not null && request.Image.Length > 0)
        {
            // Delete old image if it exists
            if (!string.IsNullOrWhiteSpace(poi.ImageUrl))
            {
                _fileUploadService.DeleteFile(poi.ImageUrl);
            }

            // Upload new image
            poi.ImageUrl = await _fileUploadService.SaveFileAsync(request.Image, PoiUploadDirectory, cancellationToken).ConfigureAwait(false);
        }
        else if (request.ImageUrl is not null)
        {
            // Only update if explicitly provided (not null from client)
            poi.ImageUrl = request.ImageUrl;
        }

        if (request.Category is not null) poi.Category = request.Category;
        if (request.CooldownSeconds.HasValue) poi.CooldownSeconds = request.CooldownSeconds.Value;
        if (request.MinDwellSeconds.HasValue) poi.MinDwellSeconds = request.MinDwellSeconds.Value;

        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;
        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<PoiDto>(poi);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), id);

        await _softDelete.SoftDeleteAsync(poi, SyncEntityTypes.POI, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
        _uow.Pois.SoftDelete(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
