using FluentValidation;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Pois.Validators;

public class UpdatePoiRequestValidator : AbstractValidator<UpdatePoiRequest>
{
    private const int MaxNameLength = 200;
    private const int MaxCategoryLength = 100;
    private const decimal MaxRadiusMeters = 10000m;
    private const int MaxPriority = 1000;

    public UpdatePoiRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(MaxNameLength)
            .Must(BeTrimmed)
            .WithMessage("Name must not include leading or trailing whitespace.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Latitude)
            .NotEqual(0m)
            .WithMessage("Latitude is required.")
            .InclusiveBetween(-90m, 90m)
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .NotEqual(0m)
            .WithMessage("Longitude is required.")
            .InclusiveBetween(-180m, 180m)
            .When(x => x.Longitude.HasValue);

        RuleFor(x => x)
            .Must(x => x.Latitude.HasValue == x.Longitude.HasValue)
            .WithMessage("Both latitude and longitude are required when updating map location.")
            .When(x => x.Latitude.HasValue || x.Longitude.HasValue);

        RuleFor(x => x)
            .Must(x => x.Latitude != 0m || x.Longitude != 0m)
            .WithMessage("Map location is required.")
            .When(x => x.Latitude.HasValue && x.Longitude.HasValue);

        RuleFor(x => x.RadiusMeters)
            .GreaterThan(0m)
            .LessThanOrEqualTo(MaxRadiusMeters)
            .When(x => x.RadiusMeters.HasValue);

        RuleFor(x => x.CooldownSeconds)
            .GreaterThanOrEqualTo(0)
            .When(x => x.CooldownSeconds.HasValue);

        RuleFor(x => x.MinDwellSeconds)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinDwellSeconds.HasValue);

        RuleFor(x => x.Priority)
            .InclusiveBetween(1, MaxPriority)
            .When(x => x.Priority.HasValue);

        RuleFor(x => x.Category)
            .MaximumLength(MaxCategoryLength)
            .Must(BeTrimmed)
            .WithMessage("Category must not include leading or trailing whitespace.")
            .When(x => x.Category is not null);
    }

    private static bool BeTrimmed(string? value) =>
        value is null || value == value.Trim();
}
