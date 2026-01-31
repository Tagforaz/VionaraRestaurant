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
        public async Task<IActionResult> Register([FromForm] RegisterDto userDto)
        {
            await _service.RegisterAsync(userDto);
            return Created();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromForm] LoginDto userDto)
        {

            return Ok(await _service.LoginAsync(userDto));
        }
    }
}
