using FluentValidation;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Qr.Validators;

public class UpdateQrRequestValidator : AbstractValidator<UpdateQrRequest>
{
    private const int MaxAccessDurationMinutes = 1440;

    public UpdateQrRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => !(x.PoiId.HasValue && x.TourId.HasValue))
            .WithMessage("Mã QR chỉ được gắn với một POI hoặc một tour, không được chọn cả hai.");

        RuleFor(x => x.PriceAmount)
            .GreaterThanOrEqualTo(0m)
            .When(x => x.PriceAmount.HasValue)
            .WithMessage("Giá không được nhỏ hơn 0.");

        RuleFor(x => x.PriceAmount)
            .GreaterThan(0m)
            .When(x => x.RequiresPayment == true && x.PriceAmount.HasValue)
            .WithMessage("Giá phải lớn hơn 0 khi mã QR yêu cầu thanh toán.");

        RuleFor(x => x.AccessDurationMinutes)
            .InclusiveBetween(1, MaxAccessDurationMinutes)
            .When(x => x.AccessDurationMinutes.HasValue)
            .WithMessage($"Thời lượng truy cập phải từ 1 đến {MaxAccessDurationMinutes} phút.");
    }
}
