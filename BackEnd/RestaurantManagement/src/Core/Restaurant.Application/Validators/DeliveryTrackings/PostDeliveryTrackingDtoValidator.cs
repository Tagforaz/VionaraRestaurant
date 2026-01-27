

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PostDeliveryTrackingDtoValidator: AbstractValidator<PostDeliveryTrackingDto>
    {
        public PostDeliveryTrackingDtoValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("OrderId is required");

            RuleFor(x => x.CourierId)
                .NotEmpty().WithMessage("CourierId is required");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180");

            RuleFor(x => x.LocationAddress)
                .MaximumLength(500).WithMessage("LocationAddress must be less than 500 characters")
                .When(x => !string.IsNullOrEmpty(x.LocationAddress));

            RuleFor(x=>x.Notes)
                .MaximumLength(500).WithMessage("Notes must be less than 500 characters")
                .When(x=>!string.IsNullOrEmpty(x.Notes));

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Status is not valid");

            RuleFor(x => x.EstimatedDeliveryTime)
                .GreaterThan(DateTime.UtcNow).WithMessage("EstimatedDeliveryTime must be in the future");
        }
    }
}
