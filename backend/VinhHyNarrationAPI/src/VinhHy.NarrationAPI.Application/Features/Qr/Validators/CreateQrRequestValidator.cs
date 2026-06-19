using FluentValidation;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Qr.Validators;

public class CreateQrRequestValidator : AbstractValidator<CreateQrRequest>
{
    private const int MaxAccessDurationMinutes = 1440;

    public CreateQrRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => !(x.PoiId.HasValue && x.TourId.HasValue))
            .WithMessage("QR code can target either a POI or a tour, not both.");

        RuleFor(x => x.PriceAmount)
            .GreaterThanOrEqualTo(0m);

        RuleFor(x => x.PriceAmount)
            .GreaterThan(0m)
            .When(x => x.RequiresPayment)
            .WithMessage("Price amount must be greater than 0 when payment is required.");

        RuleFor(x => x.AccessDurationMinutes)
            .InclusiveBetween(1, MaxAccessDurationMinutes);
    }
}
