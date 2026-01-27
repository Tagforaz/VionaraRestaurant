

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PostReservationDtoValidator:AbstractValidator<PostReservationDto>
    {
        public PostReservationDtoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId is required");

            RuleFor(x => x.Date)
                .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Date must be today or in the future");

            RuleFor(x => x.Time)
                .NotNull().WithMessage("Time is required");

            RuleFor(x => x.PartySize)
                .GreaterThan(0).WithMessage("PartySize must be greater than zero");

            RuleFor(x => x.CustomerName)
                .NotEmpty().WithMessage("CustomName is required")
                .MaximumLength(200);

            RuleFor(x => x.CustomerEmail)
                .NotEmpty().WithMessage("CustomerEmail is required")
                .EmailAddress().WithMessage("CustomerEmail must be a valid email")
                .MaximumLength(200);

            RuleFor(x => x.CustomerPhone)
                .NotEmpty().WithMessage("CustomerPhone is required")
                .MaximumLength(20);

            RuleFor(x => x.SpecialRequests)
                .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.SpecialRequests));
        }
    }
}
