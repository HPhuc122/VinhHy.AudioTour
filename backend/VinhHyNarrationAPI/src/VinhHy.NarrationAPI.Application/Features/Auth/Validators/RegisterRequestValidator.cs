using FluentValidation;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Auth.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Ten dang nhap khong duoc de trong")
            .MinimumLength(3).WithMessage("Ten dang nhap toi thieu 3 ky tu")
            .MaximumLength(100).WithMessage("Ten dang nhap toi da 100 ky tu");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email khong duoc de trong")
            .EmailAddress().WithMessage("Email khong hop le")
            .MaximumLength(254).WithMessage("Email toi da 254 ky tu");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mat khau khong duoc de trong")
            .MinimumLength(6).WithMessage("Mat khau toi thieu 6 ky tu")
            .MaximumLength(128).WithMessage("Mat khau toi da 128 ky tu");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Xac nhan mat khau khong duoc de trong")
            .Equal(x => x.Password).WithMessage("Xac nhan mat khau khong khop");

        RuleFor(x => x.OwnerName)
            .NotEmpty().WithMessage("Ten chu sap khong duoc de trong")
            .MaximumLength(150).WithMessage("Ten chu sap toi da 150 ky tu");

        RuleFor(x => x.StoreName)
            .NotEmpty().WithMessage("Ten sap khong duoc de trong")
            .MaximumLength(150).WithMessage("Ten sap toi da 150 ky tu");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(30).WithMessage("So dien thoai toi da 30 ky tu")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.PreferredLanguage)
            .NotEmpty()
            .MaximumLength(10);
    }
}
