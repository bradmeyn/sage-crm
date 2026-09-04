using Microsoft.AspNetCore.Mvc;
using CrmApi.DTOs.Auth;
using CrmApi.Services; 
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _config;

    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger,
        IConfiguration config)
    {
        _authService = authService;
        _logger = logger;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto data)
    {
        _logger.LogInformation("Register attempt for email: {Email}", data.Email);

        try
        {
            var result = await _authService.RegisterAsync(data);
            return Ok(new
            {
                message = "Registration successful! Please check your email to confirm your account.",
                userId = result.UserId,
                businessId = result.BusinessId,
                emailSent = result.EmailSent,
                requiresEmailConfirmation = true
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration failed");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto data)
    {
        _logger.LogInformation("Login attempt for email: {Email}", data.Email);

        try
        {
            var authResponse = await _authService.LoginAsync(data);
            return Ok(authResponse);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Login failed");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(string userId, string token)
    {
        var frontendUrl = _config["Frontend:BaseUrl"];

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
        {
            return Redirect($"{frontendUrl}/email-confirmation?error=invalid-link");
        }

        var success = await _authService.ConfirmEmailAsync(userId, token);
        if (success)
        {
            return Redirect($"{frontendUrl}/email-confirmed?status=success");
        }

        return Redirect($"{frontendUrl}/email-confirmation?error=confirmation-failed");
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationDto data)
    {
        // Delegate to service for resending confirmation
        try
        {
            var result = await _authService.RegisterAsync(new RegisterDto { Email = data.Email, FirstName = "", LastName = "", BusinessName = "" });
            // We just want to indicate success; RegisterAsync will throw if email exists
            return Ok(new { message = "If the email exists, a confirmation email has been sent." });
        }
        catch
        {
            // Swallow any errors to avoid exposing existence of email
            return Ok(new { message = "If the email exists, a confirmation email has been sent." });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // For JWT, logout is handled client-side by discarding the token
        // You could implement token blacklisting here if needed
        _logger.LogInformation("Logout endpoint called");
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken(RefreshTokenDto data)
    {
        try
        {
            if (string.IsNullOrEmpty(data.RefreshToken))
            {
                return BadRequest(new { error = "Refresh token is required" });
            }

            var tokenResponse = await _authService.RefreshTokenAsync(data.RefreshToken);
            return Ok(tokenResponse);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token refresh failed");
            return BadRequest(new { error = "Invalid refresh token" });
        }
    }
    
    [HttpGet("user")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
           var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
           if (string.IsNullOrEmpty(userId)) return Unauthorized();

           var user = await _authService.GetCurrentUserAsync(userId);
           if (user == null) return NotFound();
           return Ok(user);
    }   
}