

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class ForgotPasswordDtoValidator:AbstractValidator<ForgotPasswordDto>
    {
        public ForgotPasswordDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(256).WithMessage("Email must be less than 256 characters");
        }
    }
}
