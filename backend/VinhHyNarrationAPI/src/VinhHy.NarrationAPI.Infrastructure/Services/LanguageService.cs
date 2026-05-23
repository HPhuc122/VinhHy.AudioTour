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
}
