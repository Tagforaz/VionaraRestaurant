using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TablesController : ControllerBase
    {
        private readonly ITableService _service;

        public TablesController(ITableService service)
        {
            _service = service;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] PostTableDto tableDto)
        {

            var tableId = await _service.CreateAsync(tableDto);
            return CreatedAtAction(nameof(GetById), new { id = tableId },
                new { message = "Table created successfully", tableId });
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new {message = "Table not found"});
            return Ok(result);
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(int page = 1, int take = 10)
        {
            if (page < 1)
                return BadRequest(new { error = "Page must be at least 1" });

            if (take < 1 || take > 100)
                return BadRequest(new { error = "Take must be between 1 and 100" });

            return Ok(await _service.GetAllAsync(page, take));
        }

        [HttpGet("available")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableTables(
            [FromQuery] DateTime date,
            [FromQuery] TimeSpan time,
            [FromQuery] int partySize)
        {
            if (date.Date < DateTime.UtcNow.Date)
                return BadRequest(new { error = "Date cannot be in the past" });

            if (partySize < 1)
                return BadRequest(new { error = "Party size must be at least 1" });

            if (partySize > 20)
                return BadRequest(new { error = "Party size cannot exceed 20" });

            var result = await _service.GetAvailableTablesAsync(date, time, partySize);
            return Ok(new
            {
                date = date.ToString("yyyy-MM-dd"),
                time = time.ToString(@"hh\:mm"),
                partySize,
                availableTables = result
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PutTableDto tableDto)
        {
            await _service.UpdateAsync(id, tableDto);
            return Ok(new {message= "Table updated successfully"});
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return Ok(new {message = "Table deleted successfully"});
        }
    }
}
