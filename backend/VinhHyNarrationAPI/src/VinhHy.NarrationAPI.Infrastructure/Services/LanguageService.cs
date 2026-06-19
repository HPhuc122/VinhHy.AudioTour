using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Languages.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class LanguageService : ILanguageService
{
    private static readonly IReadOnlyDictionary<string, (string Name, string NativeName, int SortOrder)> AllowedLanguages =
        new Dictionary<string, (string Name, string NativeName, int SortOrder)>(StringComparer.OrdinalIgnoreCase)
        {
            ["vi"] = ("Vietnamese", "Tiếng Việt", 1),
            ["en"] = ("English", "English", 2),
            ["zh"] = ("Chinese", "中文", 3),
            ["ko"] = ("Korean", "한국어", 4),
            ["ja"] = ("Japanese", "日本語", 5),
            ["fr"] = ("French", "Français", 6),
            ["es"] = ("Spanish", "Español", 7),
            ["ru"] = ("Russian", "Русский", 8),
            ["de"] = ("German", "Deutsch", 9),
            ["th"] = ("Thai", "ไทย", 10),
            ["it"] = ("Italian", "Italiano", 11),
            ["pt"] = ("Portuguese", "Português", 12),
            ["id"] = ("Indonesian", "Bahasa Indonesia", 13),
            ["hi"] = ("Hindi", "हिन्दी", 14),
            ["ar"] = ("Arabic", "العربية", 15),
            ["nl"] = ("Dutch", "Nederlands", 16)
        };

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
        var code = request.Code.Trim().ToLowerInvariant();
        if (!AllowedLanguages.TryGetValue(code, out var metadata))
        {
            throw new ValidationException(nameof(request.Code), "Language code is not supported.");
        }

        if (await _uow.Languages.GetByCodeAsync(code, cancellationToken).ConfigureAwait(false) is not null)
        {
            throw new ValidationException(nameof(request.Code), "Language already exists.");
        }

        var entity = new Domain.Entities.Language
        {
            Code = code,
            Name = string.IsNullOrWhiteSpace(request.Name) ? metadata.Name : request.Name.Trim(),
            NativeName = string.IsNullOrWhiteSpace(request.NativeName) ? metadata.NativeName : request.NativeName.Trim(),
            IsActive = request.IsActive,
            SortOrder = request.SortOrder > 0 ? request.SortOrder : metadata.SortOrder,
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
