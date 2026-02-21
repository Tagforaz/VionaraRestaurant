using Microsoft.Extensions.Options;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Infrastructure.Settings;
using Stripe.Checkout;

namespace Restaurant.Infrastructure.Implementations.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly StripeSettings _stripeSettings;

        public PaymentService(IOptions<StripeSettings> stripeSettings)
        {
            _stripeSettings = stripeSettings.Value;
        }

        public async Task<string> CreateCheckoutSessionAsync(
            decimal amount,
            string orderId,
            string userId,
            string successUrl,
            string cancelUrl)
        {
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = "azn",
                            UnitAmount = (long)(amount * 100), 
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = "Sifariş ödənişi",
                                Description = $"Sifariş №: {orderId}"
                            }
                        },
                        Quantity = 1
                    }
                },
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "orderId", orderId },
                    { "userId", userId }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            return session.Url;
        }
    }
}