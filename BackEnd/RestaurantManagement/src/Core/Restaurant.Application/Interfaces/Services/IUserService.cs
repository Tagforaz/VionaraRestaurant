

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IUserService
    {
        Task<UserResponseDto> GetUserByIdAsync(Guid userId);
        Task<UserResponseDto> UpdateUserAsync(Guid userId, PutUserDto dto);
        Task DeleteUserAsync(Guid userId);
    }
}
