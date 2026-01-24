using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryTrackingsController : ControllerBase
    {
        private readonly IDeliveryTrackingService _service;

        public DeliveryTrackingsController(IDeliveryTrackingService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page, int take)
        {
            return Ok(await _service.GetAllAsync(page, take));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm]PostDeliveryTrackingDto deliveryTrackingDto)
        {
            await _service.CreateAsync(deliveryTrackingDto);
            return Created();
        }

      
    }
}
