

using Microsoft.Extensions.Configuration;
using Restaurant.Application.Interfaces.Services;
using System.Net;
using System.Net.Mail;

namespace Restaurant.Infrastructure.Implementations.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _smtpServer;
        private readonly int _smtpPort;
        private readonly string _senderEmail;
        private readonly string _senderPassword;
        private readonly string _senderName;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            _smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            _senderEmail = _configuration["EmailSettings:SenderEmail"] ?? throw new ArgumentNullException("SenderEmail is missing");
            _senderPassword = _configuration["EmailSettings:SenderPassword"] ?? throw new ArgumentNullException("SenderPassword is missing");
            _senderName = _configuration["EmailSettings:SenderName"] ?? "Vionara Restaurant";
        }

        public async Task SendPasswordResetCodeAsync(string toEmail, string userName, string code, int expiresInMinutes)
        {
            var subject = "Password Reset Code - Vionara Restaurant";
            var body = GetPasswordResetEmailBody(userName, code, expiresInMinutes);

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string userName)
        {
            var subject = "Welcome to Vionara Restaurant!";
            var body = GetWelcomeEmailBody(userName);

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendOrderConfirmationAsync(string toEmail, string userName, string orderNumber)
        {
            var subject = $"Order Confirmation #{orderNumber}";
            var body = GetOrderConfirmationEmailBody(userName, orderNumber);

            await SendEmailAsync(toEmail, subject, body);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                using var client = new SmtpClient(_smtpServer, _smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(_senderEmail, _senderPassword)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_senderEmail, _senderName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to send email: {ex.Message}", ex);
            }
        }

        private string GetPasswordResetEmailBody(string userName, string code, int expiresInMinutes)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }}
        .content {{
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }}
        .code-box {{
            background: white;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }}
        .code {{
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
        }}
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class=""header"">
        <h1>🔐 Password Reset Request</h1>
        <p>Vionara Restaurant</p>
    </div>
    
    <div class=""content"">
        <p>Hello <strong>{userName}</strong>,</p>
        
        <p>We received a request to reset your password. Use the verification code below to complete the process:</p>
        
        <div class=""code-box"">
            <div class=""code"">{code}</div>
            <p style=""margin: 10px 0 0 0; color: #666;"">Enter this code to reset your password</p>
        </div>
        
        <div class=""warning"">
            ⚠️ <strong>Important:</strong> This code will expire in <strong>{expiresInMinutes} minutes</strong>.
        </div>
        
        <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>
        
        <p>For security reasons:</p>
        <ul>
            <li>Never share this code with anyone</li>
            <li>Our team will never ask for this code</li>
            <li>This code can only be used once</li>
        </ul>
    </div>
    
    <div class=""footer"">
        <p>Best regards,<br><strong>Vionara Restaurant Team</strong></p>
        <p style=""font-size: 12px; color: #999;"">
            This is an automated message, please do not reply to this email.
        </p>
    </div>
</body>
</html>";
        }

        private string GetWelcomeEmailBody(string userName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
    </style>
</head>
<body>
    <div class=""header"">
        <h1>🎉 Welcome to Vionara!</h1>
    </div>
    <div class=""content"">
        <p>Hello <strong>{userName}</strong>,</p>
        <p>Welcome to Vionara Restaurant! We're excited to have you with us.</p>
        <p>You can now:</p>
        <ul>
            <li>Browse our delicious menu</li>
            <li>Make reservations</li>
            <li>Place orders online</li>
            <li>Track your orders in real-time</li>
        </ul>
        <p>Best regards,<br><strong>Vionara Restaurant Team</strong></p>
    </div>
</body>
</html>";
        }

        private string GetOrderConfirmationEmailBody(string userName, string orderNumber)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .order-number {{ font-size: 24px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class=""header"">
        <h1>✅ Order Confirmed!</h1>
    </div>
    <div class=""content"">
        <p>Hello <strong>{userName}</strong>,</p>
        <p>Thank you for your order!</p>
        <div class=""order-number"">Order #{orderNumber}</div>
        <p>We're preparing your order and will notify you when it's ready.</p>
        <p>Best regards,<br><strong>Vionara Restaurant Team</strong></p>
    </div>
</body>
</html>";
        }
    }
}