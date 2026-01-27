

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutReviewDtoValidator : AbstractValidator<PutReviewDto>
    {
        public PutReviewDtoValidator()
        {
            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

            RuleFor(x => x.Comment)
                .NotEmpty().WithMessage("Comment is required")
                .MaximumLength(1000).WithMessage("Comment must be less than 1000 characters");
        }
    }
}
