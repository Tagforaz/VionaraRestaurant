using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _service;

        public ProductsController(IProductService service)
        {
            _service = service;
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
        
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new {message = "Product  not found"});
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] PostProductDto productDto)
        {
            await _service.CreateAsync(productDto);
            return Ok(new {message = "Product created succesfully"});
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromForm] PutProductDto productDto)
        {
            await _service.UpdateAsync(id, productDto);
            return Ok(new {message = "Product updated succesfully"});
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return Ok(new {message="Product deleted successfully"});
        }

        [HttpDelete("{id}/soft-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(Guid id)
        {
            await _service.SoftDeleteAsync(id);
            return Ok(new {message = "Product soft deleted succesfully"});
        }

        [HttpGet("soft-deleted")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSoftDeleted(int page = 1, int take = 10)
        {
            if (page < 1)
                return BadRequest(new { error = "Page must be at least 1" });

            if (take < 1 || take > 100)
                return BadRequest(new { error = "Take must be between 1 and 100" });

            var products = await _service.GetSoftDeletedAsync(page, take);
            return Ok(products);
        }


        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            await _service.RestoreAsync(id);
            return Ok(new { message = "Product restored successfully" });
        }
    }
}
