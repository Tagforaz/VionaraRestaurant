

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators.User
{
    public class LoginDtoValidator:AbstractValidator<LoginDto>
    {
        public LoginDtoValidator()
        {
            RuleFor(x => x.UsernameOrEmail)
               .NotEmpty().WithMessage("Username or Email is required")
               .MinimumLength(4).WithMessage("Username or Email must be at least 4  characters")
               .MaximumLength(256).WithMessage("Username or Email must be less than 256 characters")
               .Matches(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$").WithMessage("Username or Email is not valid");

            RuleFor(x => x.Password)
             .NotEmpty().WithMessage("Password is required")
             .MinimumLength(8).WithMessage("Password must be at least 8 characters");
        }
    }
}
