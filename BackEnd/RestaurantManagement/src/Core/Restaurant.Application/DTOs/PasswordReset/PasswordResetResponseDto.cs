
namespace Restaurant.Application.DTOs
{
    public record PasswordResetResponseDto
    (
        string Message,
        int ExpiresInMinutes
    );
    
}
