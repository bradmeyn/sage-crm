using CrmApi.Models;

namespace CrmApi.Services;

/// <summary>
/// Dev-only stand-in for <see cref="EmailService"/> — no SMTP credentials needed locally.
/// Logs the email content (and, critically, the confirmation link) to the console instead
/// of sending it, so registration/email-confirmation can be exercised end to end without a
/// real mail provider. Swapped in for <see cref="IEmailService"/> only when
/// IsDevelopment() — see Program.cs.
/// </summary>
public class ConsoleEmailService : IEmailService
{
    private readonly ILogger<ConsoleEmailService> _logger;

    public ConsoleEmailService(ILogger<ConsoleEmailService> logger)
    {
        _logger = logger;
    }

    public Task<bool> SendEmailAsync(string to, string subject, string htmlBody)
    {
        _logger.LogInformation("[DEV EMAIL] To: {To} | Subject: {Subject}\n{Body}", to, subject, htmlBody);
        return Task.FromResult(true);
    }

    public Task<bool> SendEmailConfirmationAsync(User user, string confirmationLink)
    {
        _logger.LogInformation(
            "[DEV EMAIL] Confirmation link for {Email}:\n{Link}",
            user.Email,
            confirmationLink);
        return Task.FromResult(true);
    }

    public Task<bool> SendWelcomeEmailAsync(User user)
    {
        _logger.LogInformation("[DEV EMAIL] Welcome email for {Email}", user.Email);
        return Task.FromResult(true);
    }
}
