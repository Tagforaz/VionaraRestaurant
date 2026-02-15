using FluentValidation;
using Restaurant.Application.DTOs;


namespace Restaurant.Application.Validators.User
{
    public class PutUserDtoValidator : AbstractValidator<PutUserDto>
    {
        public PutUserDtoValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .MinimumLength(3).WithMessage("First name must be at least 3 characters")
                .MaximumLength(50).WithMessage("First name must be less than 50 characters")
                .Matches(@"^[A-Za-z\s]*$").WithMessage("First name can only contain letters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MinimumLength(3).WithMessage("Last name must be at least 3 characters")
                .MaximumLength(50).WithMessage("Last name must be less than 50 characters")
                .Matches(@"^[A-Za-z\s]*$").WithMessage("Last name can only contain letters");

            RuleFor(x => x.PhoneNumber)
                .Matches(@"^\+994(50|10|51|55|70|77|99)\d{7}$")
                .WithMessage("Invalid Azerbaijan phone number. Format: +994501234567")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.FullAddress)
                .Must(address =>
                {
                    if (string.IsNullOrWhiteSpace(address)) return true;
                    var parts = address.Split(',', StringSplitOptions.TrimEntries);
                    return parts.Length >= 3;
                })
                .WithMessage("Address must contain Street, City, and Country separated by commas. Example: 'Qedirli Street 130, Baku, Azerbaijan'")
                .When(x => !string.IsNullOrEmpty(x.FullAddress));
        }
    }
}
