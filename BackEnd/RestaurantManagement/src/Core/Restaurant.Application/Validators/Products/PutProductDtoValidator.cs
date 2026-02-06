

using FluentValidation;
using Microsoft.AspNetCore.Http;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutProductDtoValidator : AbstractValidator<PutProductDto>
    {
        public PutProductDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MaximumLength(1000).WithMessage("Name must be less than 100 characters");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must be less than 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Price)
                 .NotEmpty().WithMessage("Price is required")
                 .GreaterThan(0).WithMessage("Price must be greater than zero")
                 .LessThanOrEqualTo(999999.99m).WithMessage("Price cannot exceed 999,999.99")
                 .Must(BeValidDecimal).WithMessage("Price must be a valid number with up to 2 decimal places");

            RuleFor(x => x.ImageFile)
              .Must(BeValidImage).When(x => x.ImageFile != null)
              .WithMessage("Only JPG, JPEG, PNG, WEBP files are allowed (max 5MB)");

            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage("CategoryId is required");

            RuleFor(x => x.IsAvailable)
                .NotNull().WithMessage("IsAvailable must be specified");
        }
        private bool BeValidImage(IFormFile? file)
        {
            if (file == null) return true;

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            var maxSize = 5 * 1024 * 1024;

            return allowedExtensions.Contains(extension) && file.Length <= maxSize;
        }
        private bool BeValidDecimal(decimal price)
        {
            return decimal.Round(price, 2) == price;
        }
    }
}
