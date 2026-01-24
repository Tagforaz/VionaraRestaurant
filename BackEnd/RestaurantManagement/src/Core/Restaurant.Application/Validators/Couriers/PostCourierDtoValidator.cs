

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PostCourierDtoValidator:AbstractValidator<PostCourierDto>
    {
        public PostCourierDtoValidator()
        {
            RuleFor(x=>x.UserId)
                .NotEmpty().WithMessage("UserId is required");

            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("VehicleType is not valid");
        }
    }
}
