using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly IAuthenticationService _service;

        public AuthenticationController(IAuthenticationService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterDto userDto)
        {
            await _service.RegisterAsync(userDto);
            return Ok(new {message = "Registration succesful.Please Login."});
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto userDto)
        {

            return Ok(await _service.LoginAsync(userDto));
        }
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(Guid userId, IFormFile file)
        {
            await _service.UploadAvatarAsync(userId, file);
            return Ok("Avatar uploaded successfully");
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var result = await _service.ForgotPasswordAsync(dto);
            return Ok(result);
        }

        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeDto dto)
        {
            var result = await _service.VerifyResetCodeAsync(dto);
            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            await _service.ResetPasswordAsync(dto);
            return Ok(new { message = "Password reset successfully. You can now login with your new password." });
        }
    }
}
