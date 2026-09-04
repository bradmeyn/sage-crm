using System.Text.Json.Serialization;

namespace Api.DTOs.Client;

public class AddressDto
{
    [JsonPropertyName("street")]
    public string Street { get; set; } = string.Empty;

    [JsonPropertyName("suburb")]
    public string Suburb { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("postCode")]
    public string PostCode { get; set; } = string.Empty;
}
