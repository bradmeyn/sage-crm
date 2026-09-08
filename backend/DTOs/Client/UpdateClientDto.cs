using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Client;

public class UpdateClientDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("firstName")]
    [Required]
    [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("middleName")]
    public string? MiddleName { get; set; }

    [JsonPropertyName("lastName")]
    [Required]
    [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("preferredName")]
    [StringLength(100, ErrorMessage = "Preferred name cannot exceed 100 characters")]
    public string PreferredName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    [Required]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    [Phone(ErrorMessage = "Please enter a valid phone number")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
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
    [Range(1, 300)]
    public int? HeightCm { get; set; }

    [JsonPropertyName("weightKg")]
    [Range(1, 500)]
    public int? WeightKg { get; set; }

    // Practice
    [JsonPropertyName("status")]
    public ClientStatus Status { get; set; } = ClientStatus.Prospect;

    [JsonPropertyName("leadSource")]
    public LeadSource? LeadSource { get; set; }

    [JsonPropertyName("isVulnerable")]
    public bool IsVulnerable { get; set; }

    [JsonPropertyName("vulnerabilityNote")]
    public string? VulnerabilityNote { get; set; }

    [JsonPropertyName("quickNote")]
    public string? QuickNote { get; set; }
}
