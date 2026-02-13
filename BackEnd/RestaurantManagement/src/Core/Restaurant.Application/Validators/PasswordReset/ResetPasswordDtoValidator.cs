

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class ResetPasswordDtoValidator : AbstractValidator<ResetPasswordDto>
    {
        public ResetPasswordDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Code is required")
                .Length(4).WithMessage("Code must be exactly 6 digits")
                .Matches(@"^\d{6}$").WithMessage("Code must contain only numbers");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one number")
                .Matches(@"[!@#$%^&*()_+=\[\]{}|\\:;'<>,.?/\-]")
                .WithMessage("Password must contain at least one special character");

            RuleFor(x => x)
                .Must(x => x.ConfirmPassword == x.NewPassword)
                .WithMessage("Passwords do not match");
        }
    }
}
