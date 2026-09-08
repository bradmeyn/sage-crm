using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Financials;

public class IncomeDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("clientId")] public Guid ClientId { get; set; }
    [JsonPropertyName("category")] public IncomeCategory Category { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("amount")] public int Amount { get; set; }
    [JsonPropertyName("frequency")] public Frequency Frequency { get; set; }
    [JsonPropertyName("owner")] public IncomeOwner Owner { get; set; }
    [JsonPropertyName("notes")] public string? Notes { get; set; }
    [JsonPropertyName("createdAt")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updatedAt")] public DateTime UpdatedAt { get; set; }
}

public class IncomeInputDto
{
    [JsonPropertyName("category")] public IncomeCategory Category { get; set; } = IncomeCategory.Other;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("amount")] public int Amount { get; set; }
    [JsonPropertyName("frequency")] public Frequency Frequency { get; set; } = Frequency.Annually;
    [JsonPropertyName("owner")] public IncomeOwner Owner { get; set; } = IncomeOwner.Client;
    [JsonPropertyName("notes")] public string? Notes { get; set; }
}

public static class IncomeMappingExtensions
{
    public static IncomeDto ToDto(this ClientIncome i) => new()
    {
        Id = i.Id,
        ClientId = i.ClientId,
        Category = i.Category,
        Name = i.Name,
        Amount = i.Amount,
        Frequency = i.Frequency,
        Owner = i.Owner,
        Notes = i.Notes,
        CreatedAt = i.CreatedAt,
        UpdatedAt = i.UpdatedAt,
    };
}
