

namespace Restaurant.Application.DTOs
{
    public record ResetPasswordDto
    (
        string Email,
        string Code,
        string NewPassword,
        string ConfirmPassword
    );
    
}
