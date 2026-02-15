

using Restaurant.Application.Common;
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IRoleManagementService
    {
        Task<Guid> CreateUserAsync(PostUserByAdminDto dto);
        Task AssignRoleAsync(Guid userId, AssignRoleDto dto);
        Task<GetUserDetailDto> GetUserByIdAsync(Guid userId);
        Task<PagedResult<GetUserListDto>> GetAllUsersAsync(UserFilterDto filter);
        Task UpdateUserAsync(Guid userId, UpdateUserDto dto);
        Task DeleteUserAsync(Guid userId);
        Task<IEnumerable<string>> GetUserRolesAsync(Guid userId);

        Task<PagedResult<GetSoftDeletedUserDto>> GetSoftDeletedUsersAsync(UserFilterDto filter);

        Task RestoreUserAsync(Guid userId);
    }
}
