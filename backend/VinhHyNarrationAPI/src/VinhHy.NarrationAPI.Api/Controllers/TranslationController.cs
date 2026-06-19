using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/pois")]
[Authorize]
public class TranslationController(
    ITranslationService translationService,
    ILogger<TranslationController> logger) : ControllerBase
{
    [HttpPost("translate")]
    public async Task<IActionResult> TranslateText(
        [FromBody] TranslateTextRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var translatedText = await translationService
                .TranslateAsync(request.Text, request.TargetLanguage, cancellationToken)
                .ConfigureAwait(false);

            return this.ApiOk(new TranslateTextResponse { TranslatedText = translatedText });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "POI auto translation failed.");
            return this.ApiFail("Không thể dịch tự động lúc này.", StatusCodes.Status502BadGateway);
        }
    }
}
