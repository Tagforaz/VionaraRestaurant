

using FluentValidation;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Enums;

namespace Restaurant.Application.Validators
{
    public class PutCouponDtoValidator:AbstractValidator<PutCouponDto>
    {
        public PutCouponDtoValidator()
        {
            RuleFor(x => x.Code)
                 .NotEmpty().WithMessage("Code is required")
                 .MaximumLength(50).WithMessage("Code must be less than 50 characters")
                 .MinimumLength(5).WithMessage("Code must be more than 5 characters");

            RuleFor(x => x.DiscountValue)
                .GreaterThan(0).WithMessage("Discount value must be greater than zero")
                .When(x => x.DiscountType == DiscountType.FixedAmount);

            RuleFor(x => x.DiscountValue)
                .GreaterThan(0).WithMessage("Discount value must be greater than zero")
                .LessThanOrEqualTo(50).WithMessage("Discount value cannot be more than 50%")
                .When(x => x.DiscountType == DiscountType.Percentage);


            RuleFor(x => x.MinimumOrderAmount)
                .GreaterThanOrEqualTo(10).When(x => x.MinimumOrderAmount.HasValue)
                .WithMessage("Minimum order amount must be at least 10 AZN");

            RuleFor(x => x.MaximumDiscountAmount)
                .GreaterThanOrEqualTo(0).When(x => x.MaximumDiscountAmount.HasValue)
                .LessThanOrEqualTo(50).WithMessage("Maximum discount amount cannot be more than 50 AZN");

            RuleFor(x => x.ValidFrom)
                .LessThan(x => x.ValidTo).WithMessage("ValidFrom must be before ValidTo");

            RuleFor(x => x.ValidTo)
                .GreaterThan(x => x.ValidFrom).WithMessage("ValidTo must be after ValidFrom");


            RuleFor(x => x.UsageLimit)
                .GreaterThan(0).When(x => x.UsageLimit.HasValue)
                .LessThanOrEqualTo(100).WithMessage("Usage limit  must be greater than zero and cannot be more than 100");

            RuleFor(x => x.IsActive)
                .NotNull().WithMessage("IsActive cannot be empty");
        }
    }
}
