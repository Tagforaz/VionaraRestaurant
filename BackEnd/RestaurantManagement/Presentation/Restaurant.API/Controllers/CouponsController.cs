using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _service;

        public CouponsController(ICouponService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page,int take)
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
        public async Task<IActionResult> Create([FromForm] PostCouponDto couponDto)
        {
            await _service.CreateAsync(couponDto);
            return Created();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromForm] PutCouponDto couponDto)
        {
            await _service.UpdateAsync(id, couponDto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpDelete("{id}/soft-delete")]
        public async Task<IActionResult> SoftDelete(Guid id)
        {
            await _service.SoftDeleteAsync(id); 
            return NoContent();
        }
    }
}
