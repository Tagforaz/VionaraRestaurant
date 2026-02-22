

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class LoginDtoValidator:AbstractValidator<LoginDto>
    {
        public LoginDtoValidator()
        {
            RuleFor(x => x.Email)
               .NotEmpty().WithMessage("Email is required")
               .MinimumLength(4).WithMessage("Email must be at least 4  characters")
               .MaximumLength(256).WithMessage("Email must be less than 256 characters")
               .Matches(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$").WithMessage("Email is not valid");

            RuleFor(x => x.Password)
             .NotEmpty().WithMessage("Password is required")
             .MinimumLength(8).WithMessage("Password must be at least 8 characters");
        }
    }
}
