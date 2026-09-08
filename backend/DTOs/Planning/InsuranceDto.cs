using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Planning;

public class InsuranceDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("clientId")] public Guid ClientId { get; set; }
    [JsonPropertyName("category")] public InsuranceCategory Category { get; set; }
    [JsonPropertyName("insurer")] public string Insurer { get; set; } = string.Empty;
    [JsonPropertyName("policyNumber")] public string? PolicyNumber { get; set; }
    [JsonPropertyName("coverAmount")] public int? CoverAmount { get; set; }
    [JsonPropertyName("premium")] public int? Premium { get; set; }
    [JsonPropertyName("premiumFrequency")] public PremiumFrequency PremiumFrequency { get; set; }
    [JsonPropertyName("owner")] public Owner Owner { get; set; }
    [JsonPropertyName("status")] public InsuranceStatus Status { get; set; }
    [JsonPropertyName("startDate")] public DateOnly? StartDate { get; set; }
    [JsonPropertyName("reviewDate")] public DateOnly? ReviewDate { get; set; }
    [JsonPropertyName("notes")] public string? Notes { get; set; }
    [JsonPropertyName("createdAt")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updatedAt")] public DateTime UpdatedAt { get; set; }
}

public class InsuranceInputDto
{
    [JsonPropertyName("category")] public InsuranceCategory Category { get; set; } = InsuranceCategory.Other;
    [JsonPropertyName("insurer")] public string Insurer { get; set; } = string.Empty;
    [JsonPropertyName("policyNumber")] public string? PolicyNumber { get; set; }
    [JsonPropertyName("coverAmount")] public int? CoverAmount { get; set; }
    [JsonPropertyName("premium")] public int? Premium { get; set; }
    [JsonPropertyName("premiumFrequency")] public PremiumFrequency PremiumFrequency { get; set; } = PremiumFrequency.Monthly;
    [JsonPropertyName("owner")] public Owner Owner { get; set; } = Owner.Client;
    [JsonPropertyName("status")] public InsuranceStatus Status { get; set; } = InsuranceStatus.Active;
    [JsonPropertyName("startDate")] public DateOnly? StartDate { get; set; }
    [JsonPropertyName("reviewDate")] public DateOnly? ReviewDate { get; set; }
    [JsonPropertyName("notes")] public string? Notes { get; set; }
}

public static class InsuranceMappingExtensions
{
    public static InsuranceDto ToDto(this ClientInsurance i) => new()
    {
        Id = i.Id,
        ClientId = i.ClientId,
        Category = i.Category,
        Insurer = i.Insurer,
        PolicyNumber = i.PolicyNumber,
        CoverAmount = i.CoverAmount,
        Premium = i.Premium,
        PremiumFrequency = i.PremiumFrequency,
        Owner = i.Owner,
        Status = i.Status,
        StartDate = i.StartDate,
        ReviewDate = i.ReviewDate,
        Notes = i.Notes,
        CreatedAt = i.CreatedAt,
        UpdatedAt = i.UpdatedAt,
    };
}
