

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutUserDtoValidator : AbstractValidator<PutUserDto>
    {
        public PutUserDtoValidator()
        {
            RuleFor(x => x.FirstName)
               .NotEmpty().WithMessage("First name is required")
               .MinimumLength(2).WithMessage("First name must be at least 2 characters")
               .MaximumLength(50).WithMessage("First name must be less than 50 characters")
               .Matches(@"^[A-Za-z\s]*$").WithMessage("First name can only contain letters and spaces");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MinimumLength(2).WithMessage("Last name must be at least 2 characters")
                .MaximumLength(50).WithMessage("Last name must be less than 50 characters")
                .Matches(@"^[A-Za-z\s]*$").WithMessage("Last name can only contain letters and spaces");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .MinimumLength(4).WithMessage("Email must be at least 4 characters")
                .MaximumLength(256).WithMessage("Email must be less than 256 characters")
                .Matches(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$")
                .WithMessage("Email is not valid");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one number")
                .Matches(@"[!@#$%^&*()_+=\[\]{}|\\:;'<>.,?/\-]")
                .WithMessage("Password must contain at least one special character");

            RuleFor(x => x.PhoneNumber)
                .MaximumLength(20)
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Role is not valid");
        }
    }
}
