
using System.Text.Json.Serialization;

namespace CrmApi.DTOs.Auth;


public class RefreshTokenDto 
{
    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = string.Empty;
}

