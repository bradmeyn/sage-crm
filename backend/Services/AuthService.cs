using CrmApi.Data;
using CrmApi.Models;
using CrmApi.DTOs.Auth;
using Microsoft.AspNetCore.Identity;

namespace CrmApi.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<RegisterResultDto> RegisterAsync(RegisterDto dto);
        Task<bool> ConfirmEmailAsync(string userId, string token);
        Task<TokenResponseDto> RefreshTokenAsync(string refreshToken);
        Task<UserDto?> GetCurrentUserAsync(string userId);
    }

    public class AuthService : IAuthService
    {
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailService _emailService;

    public AuthService(
        UserManager<User> userManager,
        ApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IEmailService emailService)
    {
        _userManager = userManager;
        _context = context;
        _jwtTokenService = jwtTokenService;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) throw new InvalidOperationException("Invalid credentials");

        if (!await _userManager.CheckPasswordAsync(user, dto.Password))
            throw new InvalidOperationException("Invalid credentials");

        if (!user.EmailConfirmed) throw new InvalidOperationException("Email not confirmed");

        var tokenResponse = await _jwtTokenService.GenerateTokenAsync(user);

        return new AuthResponseDto
        {
            Token = tokenResponse.Token,
            RefreshToken = tokenResponse.RefreshToken,
            ExpiresIn = tokenResponse.ExpiresIn,
            TokenType = tokenResponse.TokenType,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName!,
                LastName = user.LastName!,
                BusinessId = user.BusinessId
            }
        };
    }

    public async Task<RegisterResultDto> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null) throw new InvalidOperationException("Email already registered");

        var business = new Business
        {
            Name = dto.BusinessName,
            Email = dto.Email
        };

        _context.Businesses.Add(business);
        await _context.SaveChangesAsync();

        var user = new User
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            BusinessId = business.Id,
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            _context.Businesses.Remove(business);
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("User creation failed");
        }

        await _userManager.AddToRoleAsync(user, "Admin");

        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var confirmationLink = $"/api/auth/confirm-email?userId={user.Id}&token={Uri.EscapeDataString(emailToken)}";
        var emailSent = await _emailService.SendEmailConfirmationAsync(user, confirmationLink);

        return new RegisterResultDto
        {
            UserId = user.Id,
            BusinessId = business.Id,
            EmailSent = emailSent
        };
    }

    public async Task<bool> ConfirmEmailAsync(string userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;
        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendWelcomeEmailAsync(user);
                }
                catch { }
            });
            return true;
        }
        return false;
    }

    public async Task<TokenResponseDto> RefreshTokenAsync(string refreshToken)
    {
        return await _jwtTokenService.RefreshTokenAsync(refreshToken);
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return null;
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName!,
            LastName = user.LastName!,
            BusinessId = user.BusinessId
        };
    }
}

}

