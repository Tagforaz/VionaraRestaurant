

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutOrderDtoValidator : AbstractValidator<PutOrderDto>
    {
        public PutOrderDtoValidator()
        {
            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Status is  not valid");
        }
    }
}
