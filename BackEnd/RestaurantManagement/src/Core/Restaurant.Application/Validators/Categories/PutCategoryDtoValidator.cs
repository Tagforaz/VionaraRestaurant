

using FluentValidation;
using Microsoft.AspNetCore.Http;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutCategoryDtoValidator : AbstractValidator<PutCategoryDto>
    {
        public PutCategoryDtoValidator()
        {
            RuleFor(x => x.Name)
               .NotEmpty().WithMessage("Name is required")
               .MaximumLength(50).WithMessage("Name must be less than 50 characters")
               .MinimumLength(2).WithMessage("Name must be more than 2 characters")
               .Matches(@"^[A-Za-z0-9\s]*$").WithMessage("Name can only contain letters,numbers and spaces");

            RuleFor(x => x.ImageFile)
              .Must(BeValidImage).When(x => x.ImageFile != null)
              .WithMessage("Only JPG, JPEG, PNG, WEBP files are allowed (max 5MB)");

            RuleFor(x => x.SortOrder)
                .GreaterThanOrEqualTo(0).WithMessage("SortOrder must be zero or positive");

            RuleFor(x => x.IsActive)
                .NotNull().WithMessage("IsActive cannot be empty");
        }
        private bool BeValidImage(IFormFile? file)
        {
            if (file == null) return true;

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            var maxSize = 5 * 1024 * 1024;

            return allowedExtensions.Contains(extension) && file.Length <= maxSize;
        }
    }
}

