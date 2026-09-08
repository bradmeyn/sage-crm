using System;
using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Client;

public class ClientResponseDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("middleName")]
    public string? MiddleName { get; set; }

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("preferredName")]
    public string PreferredName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("dateOfBirth")]
    public DateOnly? DateOfBirth { get; set; }

    [JsonPropertyName("address")]
    public AddressDto? Address { get; set; }

    // Personal
    [JsonPropertyName("gender")]
    public Gender? Gender { get; set; }

    [JsonPropertyName("maritalStatus")]
    public MaritalStatus? MaritalStatus { get; set; }

    [JsonPropertyName("residencyStatus")]
    public ResidencyStatus? ResidencyStatus { get; set; }

    // Employment
    [JsonPropertyName("occupation")]
    public string? Occupation { get; set; }

    [JsonPropertyName("employer")]
    public string? Employer { get; set; }

    [JsonPropertyName("taxFileNumber")]
    public string? TaxFileNumber { get; set; }

    // Health
    [JsonPropertyName("smoker")]
    public bool? Smoker { get; set; }

    [JsonPropertyName("healthStatus")]
    public HealthStatus? HealthStatus { get; set; }

    [JsonPropertyName("heightCm")]
    public int? HeightCm { get; set; }

    [JsonPropertyName("weightKg")]
    public int? WeightKg { get; set; }

    // Practice
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("leadSource")]
    public LeadSource? LeadSource { get; set; }

    [JsonPropertyName("isVulnerable")]
    public bool IsVulnerable { get; set; }

    [JsonPropertyName("vulnerabilityNote")]
    public string? VulnerabilityNote { get; set; }

    [JsonPropertyName("quickNote")]
    public string? QuickNote { get; set; }

    // Partner
    [JsonPropertyName("partnerId")]
    public Guid? PartnerId { get; set; }

    [JsonPropertyName("partnerRelationship")]
    public PartnerRelationship? PartnerRelationship { get; set; }

    [JsonPropertyName("businessId")]
    public Guid BusinessId { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
