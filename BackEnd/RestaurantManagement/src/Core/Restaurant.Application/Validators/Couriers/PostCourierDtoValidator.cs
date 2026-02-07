

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PostCourierDtoValidator : AbstractValidator<PostCourierDto>
    {
        public PostCourierDtoValidator()
        {
            RuleFor(x => x.FirstName)
                 .NotEmpty().WithMessage("FirstName is required")
                 .MaximumLength(50).WithMessage("FirstName must be less than 50 characters")
                  .MinimumLength(2).WithMessage("Name must be more than 2 characters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("LastName is required")
                .MaximumLength(50).WithMessage("LastName must be less than 50 characters")
                 .MinimumLength(2).WithMessage("Name must be more than 2 characters");

            RuleFor(x => x.Email)
             .NotEmpty().WithMessage("Email is required")
             .MinimumLength(4).WithMessage("Email must be at least 4  characters")
             .MaximumLength(256).WithMessage("Email must be less than 256 characters")
             .Matches(@"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$").WithMessage("Email is not valid");

            RuleFor(x => x.PhoneNumber)
               .MaximumLength(20)
               .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one number")
                .Matches(@"[\!\@\#\$\%\^\&\*\(\)\_\+\=\[\]\{\}\|\\:\;\'\<\>\,\.\?\/\-]")
                .WithMessage("Password must contain at least one special character");


            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("VehicleType is not valid");
        }
    }
}
