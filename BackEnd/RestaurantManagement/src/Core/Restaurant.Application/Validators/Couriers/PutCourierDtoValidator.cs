
using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutCourierDtoValidator:AbstractValidator<PutCourierDto>
    {
        public PutCourierDtoValidator()
        {
            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("VehicleType is not valid");

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Status is not valid");

            RuleFor(x => x.IsAvailable)
                .NotNull().WithMessage("IsAvailable must be specified");
        }
    }
}
