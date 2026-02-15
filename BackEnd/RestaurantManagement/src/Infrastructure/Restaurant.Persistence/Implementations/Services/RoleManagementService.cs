using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.Common;
using Restaurant.Application.DTOs;
using Restaurant.Application.Exceptions;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Domain.Enums;

namespace Restaurant.Persistence.Implementations.Services
{
    internal class RoleManagementService : IRoleManagementService
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IMapper _mapper;

        public RoleManagementService(
            UserManager<User> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IMapper mapper)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _mapper = mapper;
        }

        public async Task<Guid> CreateUserAsync(PostUserByAdminDto dto)
        {
            if (dto.Role == Domain.Enums.UserRole.Customer)
                throw new BusinessException("Cannot create Customer role via admin panel", "INVALID_ROLE");

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                throw new BusinessException($"Email '{dto.Email}' is already registered", "EMAIL_ALREADY_EXISTS");

            var user = _mapper.Map<User>(dto);

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ValidationException($"Failed to create user: {errors}");
            }

            var roleExists = await _roleManager.RoleExistsAsync(dto.Role.ToString());
            if (!roleExists)
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = dto.Role.ToString() });
            }

            await _userManager.AddToRoleAsync(user, dto.Role.ToString());

            return user.Id;
        }

        public async Task AssignRoleAsync(Guid userId, AssignRoleDto dto)
        {
            if (dto.Role == UserRole.Customer)
                throw new BusinessException("Cannot assign Customer role via admin panel", "INVALID_ROLE");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                throw new NotFoundException("User", userId);

            if (user.IsDeleted)
                throw new BusinessException("Cannot modify deleted user", "USER_DELETED");

            var currentRoles = await _userManager.GetRolesAsync(user);

            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    var errors = string.Join(", ", removeResult.Errors.Select(e => e.Description));
                    throw new ValidationException($"Failed to remove old roles: {errors}");
                }

            }
            var roleExists = await _roleManager.RoleExistsAsync(dto.Role.ToString());
            if (!roleExists)
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = dto.Role.ToString() });
            }

            var addResult = await _userManager.AddToRoleAsync(user, dto.Role.ToString());
            if (!addResult.Succeeded)
            {
                var errors = string.Join(", ", addResult.Errors.Select(e => e.Description));
                throw new ValidationException($"Failed to assign new role: {errors}");
            }

            user.Role = dto.Role;
            await _userManager.UpdateAsync(user);
        }

        public async Task<GetUserDetailDto> GetUserByIdAsync(Guid userId)
        {
            var user = await _userManager.Users
                .Where(u => u.Id == userId && !u.IsDeleted)
                .FirstOrDefaultAsync();

            if (user == null)
                throw new NotFoundException("User", userId);

            return _mapper.Map<GetUserDetailDto>(user);
        }

        public async Task<PagedResult<GetUserListDto>> GetAllUsersAsync(UserFilterDto filterDto)
        {
            try
            {
                if (_userManager == null)
                    throw new InvalidOperationException("UserManager is not initialized");

                if (_mapper == null)
                    throw new InvalidOperationException("Mapper is not initialized");

                var query = _userManager.Users
                    .Where(u => !u.IsDeleted)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(filterDto.SearchTerm))
                {
                    var searchTerm = filterDto.SearchTerm.ToLower().Trim();
                    query = query.Where(u =>
                        u.FirstName.ToLower().Contains(searchTerm) ||
                        u.LastName.ToLower().Contains(searchTerm) ||
                        (u.Email != null && u.Email.ToLower().Contains(searchTerm)));
                }

                if (filterDto.Role.HasValue)
                {
                    query = query.Where(u => u.Role == filterDto.Role.Value);
                }

                if (filterDto.IsActive.HasValue)
                {
                    query = query.Where(u => u.IsActive == filterDto.IsActive.Value);
                }

                if (filterDto.CreatedAfter.HasValue)
                {
                    query = query.Where(u => u.LastLoginAt >= filterDto.CreatedAfter.Value);
                }
                if (filterDto.CreatedBefore.HasValue)
                {
                    query = query.Where(u => u.LastLoginAt <= filterDto.CreatedBefore.Value);
                }

                var totalCount = await query.CountAsync();
                var users = await query
                    .OrderByDescending(u => u.LastLoginAt ?? DateTime.MinValue)
                    .ThenBy(u => u.FirstName)
                    .Skip((filterDto.Page - 1) * filterDto.Take)
                    .Take(filterDto.Take)
                    .ToListAsync();

                var userDtos = _mapper.Map<List<GetUserListDto>>(users);

                return new PagedResult<GetUserListDto>(userDtos, totalCount, filterDto.Page, filterDto.Take);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetAllUsersAsync Error: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task UpdateUserAsync(Guid userId, UpdateUserDto userDto)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                throw new NotFoundException("User", userId);

            if (user.IsDeleted)
                throw new BusinessException("Cannot modift deleted user", "USER_DELETED");

            if (userDto.Email != user.Email)
            {
                var emailExists = await _userManager.FindByEmailAsync(userDto.Email);
                if (emailExists != null)
                    throw new BusinessException($"Email '{userDto.Email}' is already registered", "EMAIL_ALREADY_EXISTS");
            }

            user.FirstName = userDto.FirstName;
            user.LastName = userDto.LastName;
            user.Email = userDto.Email;
            user.PhoneNumber = userDto.PhoneNumber;
            user.IsActive = userDto.IsActive;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                throw new ValidationException($"Failed to update user: {errors}");
            }

            if (!string.IsNullOrEmpty(userDto.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var passwordResult = await _userManager.ResetPasswordAsync(user, token, userDto.Password);

                if (!passwordResult.Succeeded)
                {
                    var errors = string.Join(", ", passwordResult.Errors.Select(e => e.Description));
                    throw new ValidationException($"Failed to update password: {errors}");
                }
            }
            if (userDto.Role != user.Role)
            {
                var currentRoles = await _userManager.GetRolesAsync(user);
                if (currentRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                }

                var roleExists = await _roleManager.RoleExistsAsync(userDto.Role.ToString());
                if (!roleExists)
                {
                    await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = userDto.Role.ToString() });
                }

                await _userManager.AddToRoleAsync(user, userDto.Role.ToString());
                user.Role = userDto.Role;
                await _userManager.UpdateAsync(user);
            }
        }
        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                throw new NotFoundException("User", userId);

            if (user.IsDeleted)
                throw new BusinessException("User is already deleted", "USER_ALREADY_DELETED");

            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.IsActive = false;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ValidationException($"Failed to delete user: {errors}");
            }
        }

        public async Task<IEnumerable<string>> GetUserRolesAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                throw new NotFoundException("User", userId);

            return await _userManager.GetRolesAsync(user);
        }

        public async Task<PagedResult<GetSoftDeletedUserDto>> GetSoftDeletedUsersAsync(UserFilterDto filter)
        {
            var query = _userManager.Users
                .IgnoreQueryFilters()
                .Where(u => u.IsDeleted)
                .AsQueryable();


            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower().Trim();
                query = query.Where(u =>
                    u.FirstName.ToLower().Contains(searchTerm) ||
                    u.LastName.ToLower().Contains(searchTerm) ||
                    (u.Email != null && u.Email.ToLower().Contains(searchTerm)));
            }

            if (filter.Role.HasValue)
            {
                query = query.Where(u => u.Role == filter.Role.Value);
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.DeletedAt)
                .Skip((filter.Page - 1) * filter.Take)
                .Take(filter.Take)
                .ToListAsync();

            var userDtos = _mapper.Map<List<GetSoftDeletedUserDto>>(users);

            return new PagedResult<GetSoftDeletedUserDto>(userDtos, totalCount, filter.Page, filter.Take);
        }
        public async Task RestoreUserAsync(Guid userId)
        {
            var user = await _userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new NotFoundException("User", userId);

            if (!user.IsDeleted)
                throw new BusinessException("User is not deleted", "USER_NOT_DELETED");

            user.IsDeleted = false;
            user.DeletedAt = null;
            user.DeletedBy = null;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BusinessException($"Failed to restore user: {errors}", "USER_RESTORE_FAILED");
            }
        }

    }
}
