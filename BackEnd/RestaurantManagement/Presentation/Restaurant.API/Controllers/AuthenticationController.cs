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
    }
}
