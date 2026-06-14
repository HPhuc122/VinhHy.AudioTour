using AutoMapper;
using VinhHy.NarrationAPI.Application.Features.Languages.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class LanguageService : ILanguageService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public LanguageService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<LanguageDto>> GetAllAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var languages = await _uow.Languages.GetAllAsync(activeOnly, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<LanguageDto>>(languages);
    }

    public async Task<LanguageDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var language = await _uow.Languages.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false);
        return language is null ? null : _mapper.Map<LanguageDto>(language);
    }

    public async Task<LanguageDto> CreateAsync(CreateLanguageRequest request, CancellationToken cancellationToken = default)
    {
        var entity = new Domain.Entities.Language
        {
            Code = request.Code,
            Name = request.Name,
            NativeName = request.NativeName,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
        };

        await _uow.Languages.AddAsync(entity, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<LanguageDto>(entity);
    }

    public async Task<LanguageDto> UpdateAsync(string code, UpdateLanguageRequest request, CancellationToken cancellationToken = default)
    {
        var language = await _uow.Languages.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false);
        if (language is null)
            throw new KeyNotFoundException($"Language not found: {code}");

        language.Name = request.Name;
        language.NativeName = request.NativeName;
        language.IsActive = request.IsActive;
        language.SortOrder = request.SortOrder;

        _uow.Languages.Update(language);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<LanguageDto>(language);
    }

    public async Task DeleteAsync(string code, CancellationToken cancellationToken = default)
    {
        var language = await _uow.Languages.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false);
        if (language is null)
            throw new KeyNotFoundException($"Language not found: {code}");

        _uow.Languages.Delete(language);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
