

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        public RegisterDtoValidator()
        {
            RuleFor(x => x.FirstName)
                   .NotEmpty().WithMessage("First name is required")
                   .MinimumLength(3).WithMessage("First  name must be at least 3 characters")
                   .MaximumLength(50).WithMessage("First name must be less than 50 characters")
                   .Matches(@"^[A-Za-z]*$").WithMessage("First name can only contain letters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MinimumLength(3).WithMessage("Last name must be at least 3 characters")
                .MaximumLength(50).WithMessage("Last name must be less than 50 characters")
                .Matches(@"^[A-Za-z]*$").WithMessage("Last name can only contain letters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .MinimumLength(4).WithMessage("Email must be at least 4  characters")
                .MaximumLength(256).WithMessage("Email must be less than 256 characters")
                .Matches(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$").WithMessage("Email is not valid");

            RuleFor(x => x.Password)
              .NotEmpty().WithMessage("Password is required")
              .MinimumLength(8).WithMessage("Password must be at least 8 characters")
              .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
              .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
              .Matches(@"[0-9]").WithMessage("Password must contain at least one number")
              .Matches(@"[!@#$%^&*()_+=\[\]{}|\\:;'<>,.?/-]")
              .WithMessage("Password must contain at least one special character");

            RuleFor(x => x)
                .Must(x => x.ConfirmPassword == x.Password)
                .WithMessage("Passwords do not match");

            RuleFor(x => x.PhoneNumber)
                .MaximumLength(20)
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.AvatarUrl)
                .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.AvatarUrl));
        }
    }
}
