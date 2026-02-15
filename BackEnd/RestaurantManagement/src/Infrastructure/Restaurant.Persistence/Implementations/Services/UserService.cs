

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Exceptions;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Persistence.Implementations.Services
{
    internal class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;

        public UserService(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<UserResponseDto> GetUserByIdAsync(Guid userId)
        {
            var user = await _userManager.Users
                .Where(u => u.Id == userId && !u.IsDeleted)
                .FirstOrDefaultAsync();

            if (user == null)
                throw new NotFoundException("User", userId);

            return MapToResponseDto(user);
        }

        public async Task<UserResponseDto> UpdateUserAsync(Guid userId, PutUserDto dto)
        {
            var user = await _userManager.Users
                .Where(u => u.Id == userId && !u.IsDeleted)
                .FirstOrDefaultAsync();

            if (user == null)
                throw new NotFoundException("User", userId);

            user.FirstName = dto.FirstName.Trim().ToUpper();
            user.LastName = dto.LastName.Trim().ToUpper();

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                try
                {
                    var phoneNumber = PhoneNumber.Create(dto.PhoneNumber);
                    user.PhoneNumber = phoneNumber.FullNumber; 
                }
                catch (ArgumentException ex)
                {
                    throw new ValidationException($"Invalid phone number: {ex.Message}");
                }
            }
            else
            {
                user.PhoneNumber = null;
            }
            if (!string.IsNullOrWhiteSpace(dto.FullAddress))
            {
                try
                {
                    user.Address = Address.Create(dto.FullAddress);
                }
                catch (ArgumentException ex)
                {
                    throw new ValidationException($"Invalid address: {ex.Message}");
                }
            }
            else
            {
                user.Address = null;
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ValidationException($"Failed to update user: {errors}");
            }

            return MapToResponseDto(user);
        }
        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null || user.IsDeleted)
                throw new NotFoundException("User", userId);

            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.IsActive = false;

            await _userManager.UpdateAsync(user);
        }
        private UserResponseDto MapToResponseDto(User user)
        {
            return new UserResponseDto(
                user.Id,
                user.FirstName,
                user.LastName,
                user.FullName,
                user.Email!,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Role,
                user.IsActive,
                user.Address?.FullAddress,
                user.LastLoginAt,
                user.CreatedAt
            );
        }
    }
}
