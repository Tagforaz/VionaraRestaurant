using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _service;

        public OrdersController(IOrderService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Moderator,Chef,Waiter,Courier,Customer")]
        public async Task<IActionResult> GetAll(int page = 1, int take = 10, [FromQuery] Guid? userId = null,[FromQuery] Guid? courierId = null)
        {
            var isCustomer = User.IsInRole("Customer");
            if (isCustomer && !userId.HasValue)
                return BadRequest(new { error = "Customer must filter by userId" });

            if (page < 1)
            {
                return BadRequest(new { error = "Page must be at least 1" });
            }

            if (take < 1 || take > 100)
            {
                return BadRequest(new { error = "Take must be between 1 and 100" });
            }

            return Ok(await _service.GetAllAsync(page, take,userId,courierId));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Moderator,Chef,Waiter,Courier,Customer")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound(new { message = "Order not found" });
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Waiter,Customer")]
        public async Task<IActionResult> Create([FromBody] PostOrderDto orderDto)
        {
            var order = await _service.CreateAsync(orderDto);
            return CreatedAtAction(nameof(GetById), new { id = order.Id },
                new { message = "Order created successfully", orderId = order.Id, orderNumber = order.OrderNumber });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Moderator,Chef,Waiter,Courier")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PutOrderDto orderDto)
        {
            await _service.UpdateAsync(id, orderDto);
            return Ok(new {message="Order updated successfully"});
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return Ok(new {message="Order deleted succesfully"});
        }
    }
}
