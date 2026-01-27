

using FluentValidation;
using Restaurant.Application.DTOs;


namespace Restaurant.Application.Validators
{
    public   class PutReservationDtoValidator:AbstractValidator<PutReservationDto>
    {
        public PutReservationDtoValidator()
        {
            RuleFor(x => x.Date)
                .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Date must be today or in the future");

            RuleFor(x => x.Time)
                .NotNull().WithMessage("Time is required");

            RuleFor(x => x.PartySize)
                .GreaterThan(0).WithMessage("PartySize must be greater than zero");

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Status is not valid");

            RuleFor(x => x.SpecialRequests)
                .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.SpecialRequests));
        }
    }
}
