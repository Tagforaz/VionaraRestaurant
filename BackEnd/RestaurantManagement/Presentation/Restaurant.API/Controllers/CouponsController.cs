using Microsoft.AspNetCore.Authorization;
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
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetAll(int page =1,int take=10)
        {
            if (page < 1)
                return BadRequest(new { error = "Page must be at least 1" });

            if (take < 1 || take > 100)
                return BadRequest(new { error = "Take must be between 1 and 100" });

            return Ok(await _service.GetAllAsync(page, take));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new {message = "Coupon not found"});
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] PostCouponDto couponDto)
        {
            await _service.CreateAsync(couponDto);
            return Ok(new {message = "Coupon created successfully"});
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PutCouponDto couponDto)
        {
            await _service.UpdateAsync(id, couponDto);
            return Ok(new {message="Coupon updated successfully"});
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return Ok(new {message = "Coupon  deleted successfully"});
        }

        [HttpDelete("{id}/soft-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(Guid id)
        {
            await _service.SoftDeleteAsync(id);
            return Ok(new { message = "Coupon soft deleted successfully" });
        }

        [HttpGet("soft-deleted")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSoftDeleted(int page = 1, int take = 10)
        {
            if (page < 1)
                return BadRequest(new { error = "Page must be at least 1" });

            if (take < 1 || take > 100)
                return BadRequest(new { error = "Take must be between 1 and 100" });

            var coupons = await _service.GetSoftDeletedAsync(page, take);
            return Ok(coupons);
        }

        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            await _service.RestoreAsync(id);
            return Ok(new { message = "Coupon restored successfully" });
        }
    }
}
