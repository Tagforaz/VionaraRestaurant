

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutTableDtoValidator : AbstractValidator<PutTableDto>
    {
        public PutTableDtoValidator()
        {
            RuleFor(x => x.TableNumber)
                .GreaterThan(0).WithMessage("TableNumber must be greater than zero")
                .LessThanOrEqualTo(999).WithMessage("TableNumber cannot exceed 999");

            RuleFor(x => x.Capacity)
                .GreaterThan(0).WithMessage("Capacity must be greater than zero")
                .LessThanOrEqualTo(12).WithMessage("Capacity cannot exceed 12");

            RuleFor(x => x.IsAvailable)
                .NotNull().WithMessage("IsAvailable is required");

            RuleFor(x => x.PositionX)
                .InclusiveBetween(0, 100).WithMessage("PositionX must be between 0 and 100");

            RuleFor(x => x.PositionY)
                .InclusiveBetween(0, 100).WithMessage("PositionY must be between 0 and 100");

            RuleFor(x => x.Rotation)
                .InclusiveBetween(0, 360).WithMessage("Rotation must be between 0 and 360")
                .When(x => x.Rotation.HasValue);
        }
    }
}
