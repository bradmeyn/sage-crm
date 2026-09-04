using System.Net;
using System.Net.Mail;
using CrmApi.Models;

namespace CrmApi.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string to, string subject, string htmlBody);
    Task<bool> SendEmailConfirmationAsync(User user, string confirmationLink);
    Task<bool> SendWelcomeEmailAsync(User user);
}


public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string htmlBody)
    {
        try
        {
            using var smtpClient = new SmtpClient(_config["Smtp:Host"])
            {
                Port = int.Parse(_config["Smtp:Port"]),
                Credentials = new NetworkCredential(_config["Smtp:Username"], _config["Smtp:Password"]),
                EnableSsl = true
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(_config["Smtp:FromEmail"], _config["Smtp:FromName"]),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(to);

            await smtpClient.SendMailAsync(mailMessage);

            _logger.LogInformation("Email sent successfully to {Email}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", to);
            return false;
        }
    }

    public async Task<bool> SendEmailConfirmationAsync(User user, string confirmationLink)
    {
        var subject = "Confirm your CRM account";
        var htmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Hi {user.FirstName},</h2>
                <p>Thank you for signing up for our CRM! Please confirm your email address to get started.</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{confirmationLink}' 
                       style='background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>
                        Confirm Email Address
                    </a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style='word-break: break-all; color: #666;'>{confirmationLink}</p>
                <p>This link will expire in 24 hours.</p>
            </div>";

        return await SendEmailAsync(user.Email, subject, htmlBody);
    }

    public async Task<bool> SendWelcomeEmailAsync(User user)
    {
        var subject = $"Welcome to CRM, {user.FirstName}!";
        var htmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Welcome aboard, {user.FirstName}! 🎉</h2>
                <p>Your email has been confirmed and your CRM account is ready to go.</p>
                <p>Ready to get started with your CRM journey!</p>
            </div>";

        return await SendEmailAsync(user.Email, subject, htmlBody);
    }
}