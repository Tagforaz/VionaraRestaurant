

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PostCourierDtoValidator : AbstractValidator<PostCourierDto>
    {
        public PostCourierDtoValidator()
        {
            RuleFor(x => x.UserId)
                 .NotEmpty().WithMessage("UserId is required");

            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("VehicleType is not valid");

            RuleFor(x => x.ImageFile)
                .Must(file => file == null || file.Length <= 5 * 1024 * 1024)
                .WithMessage("Image size must be less than 5MB")
                .When(x => x.ImageFile != null);
        }
    }
}
