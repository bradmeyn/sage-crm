using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Client;

public class LinkPartnerDto
{
    [JsonPropertyName("partnerId")]
    [Required]
    public Guid PartnerId { get; set; }

    [JsonPropertyName("relationship")]
    public PartnerRelationship Relationship { get; set; }
}
