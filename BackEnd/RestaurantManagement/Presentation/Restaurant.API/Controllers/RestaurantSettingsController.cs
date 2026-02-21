using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RestaurantSettingsController : ControllerBase
    {
        private readonly IRestaurantSettingsService _service;

        public RestaurantSettingsController(IRestaurantSettingsService service)
        {
            _service = service;
        }

        [HttpGet]
        [AllowAnonymous] 
        public async Task<IActionResult> Get()
        {
            var result = await _service.GetAsync();
            return Ok(result);
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] PutRestaurantSettingsDto dto)
        {
            var result = await _service.UpdateAsync(dto);
            return Ok(result);
        }
    }
}
