

using FluentValidation;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Validators
{
    public class PutRestaurantSettingsDtoValidator : AbstractValidator<PutRestaurantSettingsDto>
    {
        public PutRestaurantSettingsDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Restaurant name is required")
                .MinimumLength(2).WithMessage("Restaurant name must be at least 2 characters")
                .MaximumLength(100).WithMessage("Restaurant name must be less than 100 characters");

            RuleFor(x => x.Address)
                .MaximumLength(300).WithMessage("Address must be less than 300 characters")
                .Must(address =>
                {
                    if (string.IsNullOrWhiteSpace(address)) return true;
                    var parts = address.Split(',', StringSplitOptions.TrimEntries);
                    return parts.Length >= 3;
                })
                .WithMessage("Address must contain Street, City, and Country separated by commas. Example: 'Nizami Street 10, Baku, Azerbaijan'")
                .When(x => !string.IsNullOrEmpty(x.Address));

            RuleFor(x => x.Phone)
                .Matches(@"^\+994(50|10|51|55|70|77|99)\d{7}$")
                .WithMessage("Invalid Azerbaijan phone number. Format: +994501234567")
                .When(x => !string.IsNullOrEmpty(x.Phone));

            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(100).WithMessage("Email must be less than 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Email));

            RuleFor(x => x.WorkingHours)
                .NotEmpty().WithMessage("Working hours cannot be empty");

            RuleForEach(x => x.WorkingHours)
                .SetValidator(new PutWorkingHoursDtoValidator());
        }
    }

    public class PutWorkingHoursDtoValidator : AbstractValidator<PutWorkingHoursDto>
    {
        public PutWorkingHoursDtoValidator()
        {
            RuleFor(x => x.OpenTime)
                .LessThan(x => x.CloseTime)
                .When(x => x.IsOpen)
                .WithMessage("Open time must be earlier than close time");
        }
    }
}