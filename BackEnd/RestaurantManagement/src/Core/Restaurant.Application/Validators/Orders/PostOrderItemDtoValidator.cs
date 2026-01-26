
using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators.Orders
{
    public class PostOrderItemDtoValidator:AbstractValidator<PostOrderItemDto>
    {
        public PostOrderItemDtoValidator()
        {
            RuleFor(x => x.ProductId)
                .NotEmpty().WithMessage("ProductId is required");

            RuleFor(x => x.Quantity)
                .GreaterThan(0).WithMessage("Quantity must be greater than zero");
        }
    }
}
