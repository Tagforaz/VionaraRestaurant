

using Microsoft.AspNetCore.Http;
using Restaurant.Application.DTOs;
using Restaurant.Application.DTOs.Tokens;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IAuthenticationService
    {
        Task RegisterAsync(RegisterDto userDto);
        Task<TokenResponseDto> LoginAsync(LoginDto userDto);
        Task<AvatarUploadDto> UploadAvatarAsync(Guid userId, IFormFile file);

        Task<PasswordResetResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<PasswordResetResponseDto> VerifyResetCodeAsync(VerifyResetCodeDto dto);
        Task ResetPasswordAsync(ResetPasswordDto dto);
    }
}
