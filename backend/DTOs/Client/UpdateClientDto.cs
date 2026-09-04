using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Client;

public class UpdateClientDto
{
    [JsonPropertyName("firstName")]
    [Required]
    [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
    public string FirstName { get; set; } = string.Empty;

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

    [JsonPropertyName("status")]
    public ClientStatus Status { get; set; } = ClientStatus.Prospect;
}
