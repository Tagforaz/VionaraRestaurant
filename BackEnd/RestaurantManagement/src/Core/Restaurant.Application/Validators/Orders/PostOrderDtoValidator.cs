

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators.Orders
{
    public class PostOrderDtoValidator : AbstractValidator<PostOrderDto>
    {
        public PostOrderDtoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId  is required");

            RuleFor(x => x.Items)
                .NotEmpty().WithMessage("Order must have at least one item");

            RuleForEach(x => x.Items)
                .SetValidator(new PostOrderItemDtoValidator());

            RuleFor(x => x.OrderNotes)
                .MaximumLength(800).When(x => !string.IsNullOrEmpty(x.OrderNotes));

            RuleFor(x => x.TableNumber)
                .GreaterThan(0).When(x => x.TableNumber.HasValue);

            RuleFor(x => x.DeliveryAddress)
                .NotNull().When(x => x.Type == Domain.Enums.DeliveryType.Delivery)
                .WithMessage("Delivery address is required for delivery orders");

        }
    }
}
