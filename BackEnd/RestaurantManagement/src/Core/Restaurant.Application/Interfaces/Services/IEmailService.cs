

namespace Restaurant.Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetCodeAsync(string toEmail, string userName, string code, int expiresInMinutes);
        Task SendWelcomeEmailAsync(string toEmail, string userName);
        Task SendReservationConfirmationAsync(string toEmail, string customerName,
             DateTime date, TimeSpan time, int partySize, string? specialRequests);

        Task SendReservationCancelledAsync(string toEmail, string customerName,
             DateTime date, TimeSpan time);
    }
}
