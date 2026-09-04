using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Identity;
using CrmApi.Models;
using CrmApi.DTOs.Auth;
using System.Security.Cryptography;

namespace CrmApi.Services;

public interface IJwtTokenService
{
    Task<TokenResponseDto> GenerateTokenAsync(User user);
    Task<TokenResponseDto> RefreshTokenAsync(string refreshToken);
    ClaimsPrincipal? ValidateToken(string token);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;

    // In-memory storage for refresh tokens (use Redis/Database in production)
    private static readonly Dictionary<string, RefreshTokenData> _refreshTokens = new();

    public JwtTokenService(
        UserManager<User> userManager, 
        IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<TokenResponseDto> GenerateTokenAsync(User user)
    {
        var claims = await BuildClaimsAsync(user);
        var (accessToken, expiry) = GenerateAccessToken(claims);
        var refreshToken = GenerateRefreshToken(user.Id);

        return new TokenResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            Expiration = expiry,
            ExpiresIn = (int)(expiry - DateTime.UtcNow).TotalSeconds,
            TokenType = "Bearer"
        };
    }

    public async Task<TokenResponseDto> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken) || !_refreshTokens.TryGetValue(refreshToken, out var tokenData))
        {
            throw new SecurityTokenException("Invalid refresh token");
        }

        if (tokenData.ExpiresAt <= DateTime.UtcNow)
        {
            _refreshTokens.Remove(refreshToken);
            throw new SecurityTokenException("Refresh token expired");
        }

        var user = await _userManager.FindByIdAsync(tokenData.UserId.ToString());


        // Remove old refresh token and generate new tokens
        _refreshTokens.Remove(refreshToken);
        
        return await GenerateTokenAsync(user);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(GetSecretKey());

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = GetIssuer(),
                ValidateAudience = true,
                ValidAudience = GetAudience(),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    private async Task<List<Claim>> BuildClaimsAsync(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim("businessId", user.BusinessId.ToString())
        };

        // Add user roles to claims
        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim("role", role));
        }

        return claims;
    }

    private (string token, DateTime expiry) GenerateAccessToken(List<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetSecretKey()));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(GetExpirationHours());

        var token = new JwtSecurityToken(
            issuer: GetIssuer(),
            audience: GetAudience(),
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiry);
    }

    private string GenerateRefreshToken(Guid userId)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        
        var refreshToken = Convert.ToBase64String(randomBytes);
        var expiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpirationDays());

        // Store refresh token (use Redis/Database in production)
        _refreshTokens[refreshToken] = new RefreshTokenData
        {
            UserId = userId,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };

        // Clean up expired tokens periodically
        CleanupExpiredTokens();

        return refreshToken;
    }

    private void CleanupExpiredTokens()
    {
        var now = DateTime.UtcNow;
        var expiredTokens = _refreshTokens
            .Where(kvp => kvp.Value.ExpiresAt <= now)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var token in expiredTokens)
        {
            _refreshTokens.Remove(token);
        }
    }

    private string GetSecretKey()
    {
        var secretKey = _configuration["JwtSettings:Secret"];
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("JWT SecretKey not found in configuration");
        }
        
        if (secretKey.Length < 32)
        {
            throw new InvalidOperationException("JWT SecretKey must be at least 256 bits (32 characters) long");
        }
        
        return secretKey;
    }

    private string GetIssuer() => _configuration["JwtSettings:Issuer"] ?? "YourAppName";
    private string GetAudience() => _configuration["JwtSettings:Audience"] ?? "YourAppName";
    private int GetExpirationHours() => int.Parse(_configuration["JwtSettings:ExpirationInHours"] ?? "1");
    private int GetRefreshTokenExpirationDays() => int.Parse(_configuration["JwtSettings:RefreshTokenExpirationInDays"] ?? "7");

    private class RefreshTokenData
    {
        public Guid UserId { get; set; } = Guid.NewGuid();
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}