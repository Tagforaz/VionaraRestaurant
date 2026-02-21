using Microsoft.AspNetCore.Mvc;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("create-checkout-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.OrderId))
                    return BadRequest(new { error = "OrderId boşdur" });

                var frontendUrl = string.IsNullOrEmpty(request.FrontendUrl)
                    ? "http://localhost:5174"
                    : request.FrontendUrl;

                var successUrl = $"{frontendUrl}/order-tracking/{request.OrderId}?payment=success";
                var cancelUrl = $"{frontendUrl}/checkout?payment=cancelled";

                var sessionUrl = await _paymentService.CreateCheckoutSessionAsync(
                    request.Amount,
                    request.OrderId,
                    request.UserId,
                    successUrl,
                    cancelUrl
                );

                return Ok(new { url = sessionUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class CreateCheckoutSessionRequest
    {
        public decimal Amount { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string FrontendUrl { get; set; } = string.Empty;
    }
}