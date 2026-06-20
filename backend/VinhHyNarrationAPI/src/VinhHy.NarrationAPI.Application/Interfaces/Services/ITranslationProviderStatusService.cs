using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface ITranslationProviderStatusService
{
    TranslationProviderStatusDto GetStatus();
}
