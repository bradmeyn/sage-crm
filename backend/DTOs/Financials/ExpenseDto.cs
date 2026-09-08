using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Financials;

public class ExpenseDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("clientId")] public Guid ClientId { get; set; }
    [JsonPropertyName("category")] public ExpenseCategory Category { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("amount")] public int Amount { get; set; }
    [JsonPropertyName("frequency")] public Frequency Frequency { get; set; }
    [JsonPropertyName("notes")] public string? Notes { get; set; }
    [JsonPropertyName("createdAt")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updatedAt")] public DateTime UpdatedAt { get; set; }
}

public class ExpenseInputDto
{
    [JsonPropertyName("category")] public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("amount")] public int Amount { get; set; }
    [JsonPropertyName("frequency")] public Frequency Frequency { get; set; } = Frequency.Monthly;
    [JsonPropertyName("notes")] public string? Notes { get; set; }
}

public static class ExpenseMappingExtensions
{
    public static ExpenseDto ToDto(this ClientExpense e) => new()
    {
        Id = e.Id,
        ClientId = e.ClientId,
        Category = e.Category,
        Name = e.Name,
        Amount = e.Amount,
        Frequency = e.Frequency,
        Notes = e.Notes,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
    };
}
