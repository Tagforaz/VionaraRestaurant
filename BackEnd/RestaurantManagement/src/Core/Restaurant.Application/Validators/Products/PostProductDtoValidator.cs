

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PostProductDtoValidator :AbstractValidator<PostProductDto>
    {
        public PostProductDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MaximumLength(100).WithMessage("Name must be less than 100 characters");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must be less than 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Price must be greater than zero");

            RuleFor(x => x.ImageUrl)
                .MaximumLength(500).WithMessage("ImageUrl must be less than 500 characters")
                .When(x => !string.IsNullOrEmpty(x.ImageUrl));

            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage("CategoryId is required");

            RuleFor(x => x.IsAvailable)
                .NotNull().WithMessage("IsAvailable must be specified");
        }
    }
}
