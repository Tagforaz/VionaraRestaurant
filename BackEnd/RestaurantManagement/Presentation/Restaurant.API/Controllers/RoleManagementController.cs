using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;
using System.Security.Claims;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RoleManagementController : ControllerBase
    {
        private readonly IRoleManagementService _service;

        public RoleManagementController(IRoleManagementService service)
        {
            _service = service;
        }

        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody]PostUserByAdminDto dto)
        {
             var userId = await _service.CreateUserAsync(dto);
            return CreatedAtAction(
                nameof(GetUserById),
                new { id = userId },
                new
                {
                    message = "User created successfully",
                    userId,
                    email = dto.Email,
                    role = dto.Role.ToString()
                });
        }

        [HttpPut("{id}/assign-role")]
        public async Task<IActionResult> AssignRole(Guid id, [FromBody] AssignRoleDto roleDto)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId != null && Guid.Parse(currentUserId) == id)
            {
                return BadRequest(new { error = "Cannot change your own role" });
            }

            var previousRoles = await _service.GetUserRolesAsync(id);
            await _service.AssignRoleAsync(id, roleDto);

            return Ok(new
            {
                message = "Role assigned successfully",
                userId = id,
                newRole = roleDto.Role.ToString(),
                previousRoles
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] UserFilterDto filter)
        {
            var result = await _service.GetAllUsersAsync(filter);
            return Ok(result);
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            var user = await _service.GetUserByIdAsync(id);
            return Ok(user);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
        {
            await _service.UpdateUserAsync(id, dto);
            return Ok(new { message = "User updated successfully" });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId != null && Guid.Parse(currentUserId) == id)
            {
                return BadRequest(new { error = "Cannot delete your own account" });
            }

            await _service.DeleteUserAsync(id);
            return Ok(new { message = "User deleted successfully" });
        }

        [HttpGet("users/{id}/roles")]
        public async Task<IActionResult> GetUserRoles(Guid id)
        {
            var roles = await _service.GetUserRolesAsync(id);
            return Ok(new { userId = id, roles });
        }

        [HttpGet("users/soft-deleted")]
        public async Task<IActionResult> GetSoftDeletedUsers([FromQuery] UserFilterDto filter)
        {
            var result = await _service.GetSoftDeletedUsersAsync(filter);
            return Ok(result);
        }


        [HttpPost("users/{id}/restore")]
        public async Task<IActionResult> RestoreUser(Guid id)
        {
            await _service.RestoreUserAsync(id);
            return Ok(new { message = "User restored successfully" });
        }
    }
}
