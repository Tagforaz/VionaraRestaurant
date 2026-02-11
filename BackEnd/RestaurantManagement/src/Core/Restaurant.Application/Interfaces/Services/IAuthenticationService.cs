

using Microsoft.AspNetCore.Http;
using Restaurant.Application.DTOs;
using Restaurant.Application.DTOs.Tokens;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IAuthenticationService
    {
        Task RegisterAsync(RegisterDto userDto);
        Task<TokenResponseDto> LoginAsync(LoginDto userDto);
        Task UploadAvatarAsync(Guid userId, IFormFile file);
    }
}
