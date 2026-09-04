
using System.Text.Json.Serialization;

namespace CrmApi.DTOs.Auth;

public class TokenResponseDto
{
    [JsonPropertyName("access_token")]
    public string Token { get; set; } = string.Empty;
    
    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = string.Empty;
    
    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = "Bearer";
    
    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
    
    // Keep for internal use
    [JsonIgnore]
    public DateTime Expiration { get; set; }
}