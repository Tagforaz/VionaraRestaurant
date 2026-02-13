

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class VerifyResetCodeDtoValidator : AbstractValidator<VerifyResetCodeDto>
    {
        public VerifyResetCodeDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Code is required")
                .Length(4).WithMessage("Code must be exactly 4 digits")
                .Matches(@"^\d{4}$").WithMessage("Code must contain only numbers");
        }
    }
}
