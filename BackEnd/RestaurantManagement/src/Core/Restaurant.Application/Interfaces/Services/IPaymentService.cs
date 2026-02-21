

namespace Restaurant.Application.Interfaces.Services
{
    public interface IPaymentService
    {
        Task<string> CreateCheckoutSessionAsync(decimal amount, string orderId, string userId, string successUrl, string cancelUrl);
    }
}
