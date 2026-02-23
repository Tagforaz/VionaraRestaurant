using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservationsController : ControllerBase
    {
        private readonly IReservationService _service;

        public ReservationsController(IReservationService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Moderator,Waiter")]
        public async Task<IActionResult> GetAll(int page=1, int take=10)
        {
            if (page < 1)
                return BadRequest(new { error = "Page must be at least 1" });

            if (take < 1 || take > 100)
                return BadRequest(new { error = "Take must be between 1 and 100" });

            return Ok(await _service.GetAllAsync(page, take));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Moderator,Waiter")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new {message="Reservation not found"});
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> Create([FromBody]PostReservationDto reservationDto)
        {
            await _service.CreateAsync(reservationDto);
            return Ok(new {message = "Reservation created successfully"});

        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PutReservationDto reservationDto)
        {
            await _service.UpdateAsync(id,reservationDto);
            return Ok(new {message = "Reservation updated succesfully"});
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return Ok(new {message = "Reservation deleted successfully"});
        }
    }
}
