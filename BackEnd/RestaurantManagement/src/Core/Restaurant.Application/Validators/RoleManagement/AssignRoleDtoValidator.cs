

using FluentValidation;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Enums;

namespace Restaurant.Application.Validators
{
    public class AssignRoleDtoValidator:AbstractValidator<AssignRoleDto>
    {
        public AssignRoleDtoValidator()
        {
            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Role is not valid")
                .NotEqual(UserRole.Customer).WithMessage("Cannot assign Customer role via admin panel");

        }
    }
}
