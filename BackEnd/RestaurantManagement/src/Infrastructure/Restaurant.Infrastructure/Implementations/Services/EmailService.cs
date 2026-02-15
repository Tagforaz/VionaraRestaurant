

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
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }}
        .header {{
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #ea580c 100%);
            color: #ffffff;
            padding: 48px 32px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }}
        .header p {{
            font-size: 18px;
            opacity: 0.95;
            font-weight: 500;
        }}
        .brand {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 16px;
        }}
        .brand .v {{
            color: #fbbf24;
            font-size: 28px;
        }}
        .content {{
            padding: 48px 32px;
            background: #ffffff;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 24px;
            color: #1f2937;
        }}
        .greeting strong {{
            color: #d97706;
            font-weight: 600;
        }}
        .message {{
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 32px;
            line-height: 1.8;
        }}
        .code-container {{
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 3px dashed #f59e0b;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            margin: 32px 0;
        }}
        .code-label {{
            font-size: 14px;
            color: #92400e;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
        }}
        .code {{
            font-size: 56px;
            font-weight: 800;
            color: #d97706;
            letter-spacing: 16px;
            font-family: 'Courier New', Courier, monospace;
            display: block;
            margin: 16px 0;
            user-select: all;
        }}
        .code-hint {{
            font-size: 14px;
            color: #78716c;
            margin-top: 12px;
        }}
        .warning {{
            background: #fef9c3;
            border-left: 4px solid #facc15;
            padding: 20px;
            border-radius: 8px;
            margin: 32px 0;
        }}
        .warning-title {{
            font-weight: 700;
            color: #854d0e;
            font-size: 16px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .warning-text {{
            color: #713f12;
            font-size: 15px;
            line-height: 1.6;
        }}
        .info-box {{
            background: #f9fafb;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }}
        .info-box p {{
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 16px;
        }}
        .info-list {{
            list-style: none;
            padding: 0;
        }}
        .info-list li {{
            padding: 8px 0 8px 28px;
            position: relative;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.6;
        }}
        .info-list li:before {{
            content: ""✓"";
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
            font-size: 16px;
        }}
        .footer {{
            background: #f9fafb;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }}
        .footer-brand {{
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }}
        .footer-brand .v {{
            color: #f59e0b;
        }}
        .footer-text {{
            font-size: 14px;
            color: #6b7280;
            margin-top: 16px;
        }}
        .footer-disclaimer {{
            font-size: 12px;
            color: #9ca3af;
            margin-top: 16px;
            font-style: italic;
        }}
        @media only screen and (max-width: 600px) {{
            body {{
                padding: 20px 10px;
            }}
            .header {{
                padding: 32px 20px;
            }}
            .header h1 {{
                font-size: 24px;
            }}
            .content {{
                padding: 32px 20px;
            }}
            .code {{
                font-size: 40px;
                letter-spacing: 12px;
            }}
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <div class=""brand"">
                <span class=""v"">V</span>ionara
            </div>
            <h1>🔐 Şifrə Bərpası</h1>
            <p>Password Reset Request</p>
        </div>
        
        <div class=""content"">
            <p class=""greeting"">Salam <strong>{userName}</strong>,</p>
            
            <p class=""message"">
                Hesabınız üçün şifrə bərpası sorğusu aldıq. Aşağıdakı təsdiq kodundan istifadə edərək şifrənizi bərpa edə bilərsiniz:
            </p>
            
            <div class=""code-container"">
                <div class=""code-label"">Təsdiq Kodu</div>
                <div class=""code"">{code}</div>
                <div class=""code-hint"">Bu kodu şifrə bərpası səhifəsində daxil edin</div>
            </div>
            
            <div class=""warning"">
                <div class=""warning-title"">
                    ⚠️ Vacib
                </div>
                <div class=""warning-text"">
                    Bu kod <strong>{expiresInMinutes} dəqiqə</strong> ərzində etibarlıdır. Kod yalnız bir dəfə istifadə edilə bilər.
                </div>
            </div>
            
            <div class=""info-box"">
                <p>Əgər şifrə bərpası sorğusu göndərmədinizsə, bu emailə məhəl qoymayın.</p>
                
                <ul class=""info-list"">
                    <li>Təhlükəsizlik üçün bu kodu heç kimlə paylaşmayın</li>
                    <li>Komandamız sizdən bu kodu heç vaxt soruşmayacaq</li>
                    <li>Kod yalnız bir dəfə istifadə oluna bilər</li>
                    <li>Şübhəli fəaliyyət görərsinizsə bizimlə əlaqə saxlayın</li>
                </ul>
            </div>
        </div>
        
        <div class=""footer"">
            <div class=""footer-brand"">
                <span class=""v"">V</span>ionara Restaurant
            </div>
            <p class=""footer-text"">
                Hörmətlə,<br>
                <strong>Vionara Restaurant Komandası</strong>
            </p>
            <p class=""footer-disclaimer"">
                Bu avtomatik mesajdır, cavab yazmayın.
            </p>
        </div>
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
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }}
        .header {{
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #ea580c 100%);
            color: #ffffff;
            padding: 48px 32px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        .header:before {{
            content: ""🎉"";
            position: absolute;
            font-size: 120px;
            opacity: 0.1;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }}
        .header h1 {{
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
        }}
        .header p {{
            font-size: 18px;
            opacity: 0.95;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }}
        .brand {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }}
        .brand .v {{
            color: #fbbf24;
            font-size: 32px;
        }}
        .content {{
            padding: 48px 32px;
            background: #ffffff;
        }}
        .greeting {{
            font-size: 20px;
            margin-bottom: 24px;
            color: #1f2937;
            text-align: center;
        }}
        .greeting strong {{
            color: #d97706;
            font-weight: 700;
        }}
        .welcome-message {{
            font-size: 16px;
            color: #4b5563;
            text-align: center;
            margin-bottom: 40px;
            line-height: 1.8;
        }}
        .features {{
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            padding: 32px;
            margin: 32px 0;
        }}
        .features-title {{
            font-size: 18px;
            font-weight: 700;
            color: #92400e;
            text-align: center;
            margin-bottom: 24px;
        }}
        .feature-list {{
            display: grid;
            gap: 16px;
        }}
        .feature-item {{
            background: #ffffff;
            padding: 16px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }}
        .feature-icon {{
            font-size: 24px;
            flex-shrink: 0;
        }}
        .feature-text {{
            font-size: 15px;
            color: #374151;
            font-weight: 500;
        }}
        .cta-box {{
            background: #f9fafb;
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            margin: 32px 0;
        }}
        .cta-text {{
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 20px;
        }}
        .cta-button {{
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }}
        .footer {{
            background: #f9fafb;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }}
        .footer-brand {{
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }}
        .footer-brand .v {{
            color: #f59e0b;
        }}
        .footer-text {{
            font-size: 14px;
            color: #6b7280;
            margin-top: 16px;
        }}
        .footer-disclaimer {{
            font-size: 12px;
            color: #9ca3af;
            margin-top: 16px;
        }}
        @media only screen and (max-width: 600px) {{
            body {{
                padding: 20px 10px;
            }}
            .header {{
                padding: 32px 20px;
            }}
            .header h1 {{
                font-size: 28px;
            }}
            .content {{
                padding: 32px 20px;
            }}
            .features {{
                padding: 24px 16px;
            }}
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <div class=""brand"">
                <span class=""v"">V</span>ionara
            </div>
            <h1>Xoş gəlmisiniz! 🎉</h1>
            <p>Welcome to Vionara Restaurant</p>
        </div>
        
        <div class=""content"">
            <p class=""greeting"">Salam <strong>{userName}</strong>!</p>
            
            <p class=""welcome-message"">
                Vionara Restaurant ailəsinə qoşulduğunuz üçün təşəkkür edirik! 
                Biz sizə ən yaxşı kulinariya təcrübəsini yaşatmaq üçün buradayıq.
            </p>
            
            <div class=""features"">
                <div class=""features-title"">İndi nələr edə bilərsiniz:</div>
                <div class=""feature-list"">
                    <div class=""feature-item"">
                        <div class=""feature-icon"">🍽️</div>
                        <div class=""feature-text"">Zəngin menyumuzu kəşf edin</div>
                    </div>
                    <div class=""feature-item"">
                        <div class=""feature-icon"">📅</div>
                        <div class=""feature-text"">Masa rezervasiyası edin</div>
                    </div>
                    <div class=""feature-item"">
                        <div class=""feature-icon"">🛒</div>
                        <div class=""feature-text"">Onlayn sifariş verin</div>
                    </div>
                    <div class=""feature-item"">
                        <div class=""feature-icon"">🚚</div>
                        <div class=""feature-text"">Sifarişinizi real-vaxtda izləyin</div>
                    </div>
                    <div class=""feature-item"">
                        <div class=""feature-icon"">⭐</div>
                        <div class=""feature-text"">Rəy yazın və xüsusi təkliflərdən yararlanın</div>
                    </div>
                </div>
            </div>
            
            <div class=""cta-box"">
                <p class=""cta-text"">Hazırsınız? Menyu bölməsinə keçid edin və dadlı yeməklərimizi kəşf edin!</p>
                <a href=""#"" class=""cta-button"">Menyuya Bax →</a>
            </div>
        </div>
        
        <div class=""footer"">
            <div class=""footer-brand"">
                <span class=""v"">V</span>ionara Restaurant
            </div>
            <p class=""footer-text"">
                Hörmətlə,<br>
                <strong>Vionara Restaurant Komandası</strong>
            </p>
            <p class=""footer-disclaimer"">
                Bu avtomatik mesajdır, cavab yazmayın.
            </p>
        </div>
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
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }}
        .header {{
            background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
            color: #ffffff;
            padding: 48px 32px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        .header:before {{
            content: ""✓"";
            position: absolute;
            font-size: 200px;
            opacity: 0.1;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: bold;
        }}
        .header h1 {{
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
        }}
        .header p {{
            font-size: 18px;
            opacity: 0.95;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }}
        .brand {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }}
        .brand .v {{
            color: #d1fae5;
            font-size: 32px;
        }}
        .content {{
            padding: 48px 32px;
            background: #ffffff;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 24px;
            color: #1f2937;
            text-align: center;
        }}
        .greeting strong {{
            color: #059669;
            font-weight: 700;
        }}
        .thank-you {{
            font-size: 16px;
            color: #4b5563;
            text-align: center;
            margin-bottom: 32px;
            line-height: 1.8;
        }}
        .order-card {{
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            margin: 32px 0;
            border: 3px solid #10b981;
        }}
        .order-label {{
            font-size: 14px;
            color: #065f46;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }}
        .order-number {{
            font-size: 48px;
            font-weight: 800;
            color: #059669;
            font-family: 'Courier New', Courier, monospace;
            margin: 12px 0;
            letter-spacing: 2px;
        }}
        .order-hint {{
            font-size: 14px;
            color: #047857;
            margin-top: 12px;
        }}
        .status-box {{
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }}
        .status-title {{
            font-size: 16px;
            font-weight: 700;
            color: #065f46;
            margin-bottom: 16px;
            text-align: center;
        }}
        .status-steps {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-top: 20px;
        }}
        .status-step {{
            flex: 1;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }}
        .status-icon {{
            font-size: 24px;
            margin-bottom: 8px;
            display: block;
        }}
        .info-box {{
            background: #f9fafb;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }}
        .info-title {{
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 16px;
        }}
        .info-text {{
            font-size: 15px;
            color: #4b5563;
            line-height: 1.8;
            margin-bottom: 12px;
        }}
        .tracking-box {{
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 32px 0;
        }}
        .tracking-text {{
            font-size: 15px;
            color: #78350f;
            margin-bottom: 16px;
        }}
        .tracking-button {{
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff;
            padding: 12px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
        }}
        .footer {{
            background: #f9fafb;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }}
        .footer-brand {{
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }}
        .footer-brand .v {{
            color: #f59e0b;
        }}
        .footer-text {{
            font-size: 14px;
            color: #6b7280;
            margin-top: 16px;
        }}
        .footer-disclaimer {{
            font-size: 12px;
            color: #9ca3af;
            margin-top: 16px;
        }}
        @media only screen and (max-width: 600px) {{
            body {{
                padding: 20px 10px;
            }}
            .header {{
                padding: 32px 20px;
            }}
            .header h1 {{
                font-size: 28px;
            }}
            .content {{
                padding: 32px 20px;
            }}
            .order-number {{
                font-size: 36px;
            }}
            .status-steps {{
                flex-direction: column;
                gap: 16px;
            }}
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <div class=""brand"">
                <span class=""v"">V</span>ionara
            </div>
            <h1>Sifariş Təsdiqləndi! ✅</h1>
            <p>Order Confirmed</p>
        </div>
        
        <div class=""content"">
            <p class=""greeting"">Salam <strong>{userName}</strong>!</p>
            
            <p class=""thank-you"">
                Sifarişiniz üçün təşəkkür edirik! Sifarişiniz qəbul edildi və hazırlanmasına başlanıldı.
            </p>
            
            <div class=""order-card"">
                <div class=""order-label"">Sifariş Nömrəsi</div>
                <div class=""order-number"">#{orderNumber}</div>
                <div class=""order-hint"">Bu nömrəni yadda saxlayın</div>
            </div>
            
            <div class=""status-box"">
                <div class=""status-title"">📍 Sifarişinizin Statusu</div>
                <div class=""status-steps"">
                    <div class=""status-step"">
                        <span class=""status-icon"">✓</span>
                        Qəbul edildi
                    </div>
                    <div class=""status-step"">
                        <span class=""status-icon"">👨‍🍳</span>
                        Hazırlanır
                    </div>
                    <div class=""status-step"">
                        <span class=""status-icon"">📦</span>
                        Hazırdır
                    </div>
                    <div class=""status-step"">
                        <span class=""status-icon"">🚚</span>
                        Çatdırılır
                    </div>
                </div>
            </div>
            
            <div class=""tracking-box"">
                <p class=""tracking-text"">
                    Sifarişinizi real-vaxtda izləmək istəyirsiniz?
                </p>
                <a href=""#"" class=""tracking-button"">Sifarişi İzlə →</a>
            </div>
            
            <div class=""info-box"">
                <div class=""info-title"">📞 Əlaqə məlumatları</div>
                <p class=""info-text"">
                    Sualınız olarsa və ya sifarişinizlə bağlı köməyə ehtiyacınız olarsa, 
                    bizimlə əlaqə saxlamaqdan çəkinməyin.
                </p>
                <p class=""info-text"">
                    Biz sifarişiniz hazır olduqda sizə bildiriş göndərəcəyik!
                </p>
            </div>
        </div>
        
        <div class=""footer"">
            <div class=""footer-brand"">
                <span class=""v"">V</span>ionara Restaurant
            </div>
            <p class=""footer-text"">
                Hörmətlə,<br>
                <strong>Vionara Restaurant Komandası</strong>
            </p>
            <p class=""footer-disclaimer"">
                Bu avtomatik mesajdır, cavab yazmayın.
            </p>
        </div>
    </div>
</body>
</html>";
        }
    }
}