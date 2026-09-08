using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Financials;

public class LiabilityDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("clientId")] public Guid ClientId { get; set; }
    [JsonPropertyName("category")] public LiabilityCategory Category { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("balance")] public int Balance { get; set; }
    [JsonPropertyName("limit")] public int? Limit { get; set; }
    [JsonPropertyName("interestRate")] public int? InterestRate { get; set; }
    [JsonPropertyName("owner")] public Owner Owner { get; set; }
    [JsonPropertyName("notes")] public string? Notes { get; set; }
    [JsonPropertyName("createdAt")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updatedAt")] public DateTime UpdatedAt { get; set; }
}

public class LiabilityInputDto
{
    [JsonPropertyName("category")] public LiabilityCategory Category { get; set; } = LiabilityCategory.Other;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("balance")] public int Balance { get; set; }
    [JsonPropertyName("limit")] public int? Limit { get; set; }
    // Basis points (550 = 5.50%) — the frontend converts from a %-entry field.
    [JsonPropertyName("interestRate")] public int? InterestRate { get; set; }
    [JsonPropertyName("owner")] public Owner Owner { get; set; } = Owner.Client;
    [JsonPropertyName("notes")] public string? Notes { get; set; }
}

public static class LiabilityMappingExtensions
{
    public static LiabilityDto ToDto(this ClientLiability l) => new()
    {
        Id = l.Id,
        ClientId = l.ClientId,
        Category = l.Category,
        Name = l.Name,
        Balance = l.Balance,
        Limit = l.Limit,
        InterestRate = l.InterestRate,
        Owner = l.Owner,
        Notes = l.Notes,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt,
    };
}
