

namespace Restaurant.Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetCodeAsync(string toEmail, string userName, string code, int expiresInMinutes);
        Task SendWelcomeEmailAsync(string toEmail, string userName);
        Task SendOrderConfirmationAsync(string toEmail, string userName, string orderNumber);
    }
}
