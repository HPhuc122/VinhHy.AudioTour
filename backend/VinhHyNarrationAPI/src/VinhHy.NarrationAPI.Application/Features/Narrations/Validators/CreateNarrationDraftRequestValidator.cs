using FluentValidation;
using VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Narrations.Validators;

public class CreateNarrationDraftRequestValidator : AbstractValidator<CreateNarrationDraftRequest>
{
    private const int MaxTitleLength = 200;
    private const int MinTextContentLength = 10;
    private const int MaxTextContentLength = 8000;
    private const int MaxLanguageCodeLength = 10;
    private const int MaxVoiceLength = 100;

    public CreateNarrationDraftRequestValidator()
    {
        RuleFor(x => x.PoiId)
            .GreaterThan(0)
            .WithMessage("POI is required.");

        RuleFor(x => x.Title)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(MaxTitleLength)
            .Must(BeTrimmed)
            .WithMessage("Title must not include leading or trailing whitespace.");

        RuleFor(x => x.LanguageCode)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(MaxLanguageCodeLength)
            .Must(BeTrimmed)
            .WithMessage("Language code must not include leading or trailing whitespace.");

        RuleFor(x => x.TextContent)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MinimumLength(MinTextContentLength)
            .MaximumLength(MaxTextContentLength)
            .Must(BeTrimmed)
            .WithMessage("Narration text must not include leading or trailing whitespace.");

        RuleFor(x => x.Voice)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(MaxVoiceLength)
            .Must(BeTrimmed)
            .WithMessage("Voice must not include leading or trailing whitespace.");
    }

    private static bool BeTrimmed(string? value) =>
        value is null || value == value.Trim();
}
