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
        public async Task<IActionResult> GetAll(int page = 1, int take = 10)
        {
            if (page < 1)
            {
                return BadRequest(new { error = "Page must be at least 1" });
            }

            if (take < 1 || take > 100)
            {
                return BadRequest(new { error = "Take must be between 1 and 100" });
            }
            return Ok(await _service.GetAllAsync(page, take));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new {message = "Delivery tracking not found"});
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody]PostDeliveryTrackingDto deliveryTrackingDto)
        {
            await _service.CreateAsync(deliveryTrackingDto);
            return Ok(new {message = "Delivery tracking created succesfully"});
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PutDeliveryTrackingDto deliveryTrackingDto)
        {
            await _service.UpdateAsync(id, deliveryTrackingDto);
            return Ok(new { message = "Delivery tracking updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return Ok(new { message = "Delivery tracking deleted successfully" });
        }


    }
}
