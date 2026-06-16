using FluentValidation;
using VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Auth.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống")
            .MinimumLength(3).WithMessage("Tên đăng nhập tối thiểu 3 ký tự")
            .MaximumLength(100).WithMessage("Tên đăng nhập tối đa 100 ký tự");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống")
            .EmailAddress().WithMessage("Email không hợp lệ")
            .MaximumLength(254).WithMessage("Email tối đa 254 ký tự");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống")
            .MinimumLength(6).WithMessage("Mật khẩu tối thiểu 6 ký tự")
            .MaximumLength(128).WithMessage("Mật khẩu tối đa 128 ký tự");

        RuleFor(x => x.PreferredLanguage)
            .NotEmpty()
            .MaximumLength(10);
    }
}
