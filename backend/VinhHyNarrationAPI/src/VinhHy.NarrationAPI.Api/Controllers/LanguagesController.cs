using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/languages")]
[Authorize]
public class LanguagesController(ILanguageService languageService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var languages = await languageService.GetAllAsync(activeOnly, cancellationToken);
        return this.ApiOk(languages);
    }

    [HttpGet("{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken)
    {
        var language = await languageService.GetByCodeAsync(code, cancellationToken);
        if (language is null)
        {
            throw new NotFoundException("Language", code);
        }

        return this.ApiOk(language);
    }
}
