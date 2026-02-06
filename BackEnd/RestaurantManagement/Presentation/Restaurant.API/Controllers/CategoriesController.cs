using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _service;

        public CategoriesController(ICategoryService service)
        {
            _service = service;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1,int take =10)
        {
            if(page < 1)
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
            var result= await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] PostCategoryDto categoryDto)
        {
            await _service.CreateAsync(categoryDto);
            return Created();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update (Guid id, [FromForm]PutCategoryDto categoryDto)
        {
            await _service.UpdateAsync(id, categoryDto);
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
