

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class UserFilterDtoValidator:AbstractValidator<UserFilterDto>
    {
        public UserFilterDtoValidator()
        {
            RuleFor(x => x.Page)
                 .GreaterThan(0).WithMessage("Page must be greater than 0");

            RuleFor(x => x.Take)
                .InclusiveBetween(1, 100).WithMessage("Take must be between 1 and 100");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Role is not valid")
                .When(x => x.Role.HasValue);

            RuleFor(x => x)
                .Must(x => !x.CreatedAfter.HasValue || !x.CreatedBefore.HasValue || x.CreatedAfter <= x.CreatedBefore)
                .WithMessage("CreatedAfter must be before or equal to CreatedBefore");
        }
    }
}
