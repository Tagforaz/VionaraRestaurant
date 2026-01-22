

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators.Categories
{
    public class PutCategoryDtoValidator:AbstractValidator<PutCategoryDto>
    {
        public PutCategoryDtoValidator()
        {
            RuleFor(x => x.Name)
               .NotEmpty().WithMessage("Name is required")
               .MaximumLength(50).WithMessage("Name must be less than 50 characters")
               .MinimumLength(2).WithMessage("Name must be more than 2 characters")
               .Matches(@"^[A-Za-z0-9\s]*$").WithMessage("Name can only contain letters,numbers and spaces");

            RuleFor(x => x.ImageUrl)
                .MaximumLength(500).WithMessage("ImageUrl must be less than 500 characters")
                .When(x => !string.IsNullOrEmpty(x.ImageUrl));

            RuleFor(x => x.SortOrder)
                .GreaterThanOrEqualTo(0).WithMessage("SortOrder must be zero or positive");

            RuleFor(x => x.IsActive)
                .NotNull().WithMessage("IsActive cannot be empty");
        }
    }
}
