using FluentValidation;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Pois.Validators;

public class CreatePoiRequestValidator : AbstractValidator<CreatePoiRequest>
{
    private const int MaxNameLength = 200;
    private const int MaxCategoryLength = 100;
    private const decimal MaxRadiusMeters = 10000m;
    private const int MaxPriority = 1000;

    public CreatePoiRequestValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(MaxNameLength)
            .Must(BeTrimmed)
            .WithMessage("Name must not include leading or trailing whitespace.");

        RuleFor(x => x.Latitude)
            .NotEqual(0m)
            .WithMessage("Latitude is required.")
            .InclusiveBetween(-90m, 90m);

        RuleFor(x => x.Longitude)
            .NotEqual(0m)
            .WithMessage("Longitude is required.")
            .InclusiveBetween(-180m, 180m);

        RuleFor(x => x)
            .Must(x => x.Latitude != 0m || x.Longitude != 0m)
            .WithMessage("Map location is required.");

        RuleFor(x => x.RadiusMeters)
            .GreaterThan(0m)
            .LessThanOrEqualTo(MaxRadiusMeters);

        RuleFor(x => x.CooldownSeconds)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.MinDwellSeconds)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.Priority)
            .InclusiveBetween(1, MaxPriority);

        RuleFor(x => x.Category)
            .MaximumLength(MaxCategoryLength)
            .Must(BeTrimmed)
            .WithMessage("Category must not include leading or trailing whitespace.")
            .When(x => x.Category is not null);

        RuleFor(x => x.ApprovalStatus)
            .IsInEnum();
    }

    private static bool BeTrimmed(string? value) =>
        value is null || value == value.Trim();
}
