using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using System.Security.Claims;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _service;

        public ReviewsController(IReviewService service)
        {
            _service = service;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll
            (
            int page = 1,
            int take = 10,
            [FromQuery] Guid? productId = null,
            [FromQuery] Guid? userId = null
            )
        {
            if (page < 1)
                return BadRequest(new { error = "Page must be at least 1" });

            if (take < 1 || take > 100)
                return BadRequest(new { error = "Take must be between 1 and 100" });

            if (productId == null && userId == null)
            {
                if (!User.IsInRole("Admin") && !User.IsInRole("Moderator"))
                    return Forbid();
            }

            
            if (userId != null)
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!User.IsInRole("Admin") && !User.IsInRole("Moderator") && currentUserId != userId.ToString())
                    return Forbid();
            }

            return Ok(await _service.GetAllAsync(page, take, productId, userId));
        }


        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Moderator,Customer")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new {message = "Review not found"});
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> Create([FromBody] PostReviewDto reviewDto)
        {
            await _service.CreateAsync(reviewDto);
            return Ok(new {message="Review created succesfully"});
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PutReviewDto reviewDto)
        {
            await _service.UpdateAsync(id, reviewDto);
            return Ok(new {message="Review updated successfully"});
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return Ok(new {message="Review deleted successfully"});
        }
        
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] Guid approvedByUserId)
        {
            await _service.ApproveReviewAsync(id, approvedByUserId);
            return Ok(new { message = "Review approved successfully" });
        }
    }
}
