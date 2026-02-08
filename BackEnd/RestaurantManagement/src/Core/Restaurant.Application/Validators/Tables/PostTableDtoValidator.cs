

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PostTableDtoValidator : AbstractValidator<PostTableDto>
    {
        public PostTableDtoValidator()
        {
            RuleFor(x => x.TableNumber)
                .GreaterThan(0).WithMessage("TableNumber must be greater than zero");

            RuleFor(x => x.Capacity)
                .GreaterThan(0).WithMessage("Capacity must be greater than zero")
                .LessThanOrEqualTo(12).WithMessage("Capacity cannot exceed 12");
        }
    }
}
