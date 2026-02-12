
using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators.Couriers
{
    public class CreateCourierByAdminDtoValidator : AbstractValidator<CreateCourierByAdminDto>
    {
        public CreateCourierByAdminDtoValidator()
        {
            RuleFor(x => x.FirstName)
               .NotEmpty().WithMessage("FirstName is required")
               .MinimumLength(2).WithMessage("FirstName must be at least 2 characters")
               .MaximumLength(50).WithMessage("FirstName must be less than 50 characters")
               .Matches(@"^[A-Za-z]*$").WithMessage("FirstName can only contain letters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("LastName is required")
                .MinimumLength(2).WithMessage("LastName must be at least 2 characters")
                .MaximumLength(50).WithMessage("LastName must be less than 50 characters")
                .Matches(@"^[A-Za-z]*$").WithMessage("LastName can only contain letters");

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
                .MaximumLength(20).WithMessage("PhoneNumber must be less than 20 characters")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("VehicleType is not valid");

            RuleFor(x => x.ImageFile)
                .Must(file => file == null || file.Length <= 5 * 1024 * 1024)
                .WithMessage("Image size must be less than 5MB")
                .When(x => x.ImageFile != null);
        }
    }
}
