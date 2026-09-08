using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Financials;

public class AssetDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("clientId")] public Guid ClientId { get; set; }
    [JsonPropertyName("category")] public AssetCategory Category { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("value")] public int Value { get; set; }
    [JsonPropertyName("owner")] public Owner Owner { get; set; }
    [JsonPropertyName("notes")] public string? Notes { get; set; }
    [JsonPropertyName("createdAt")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updatedAt")] public DateTime UpdatedAt { get; set; }
}

// Shared by create (POST) and update (PUT /{id}) — a PUT is a full-form edit
// with the id already in the route, so there's no separate "patch" shape.
public class AssetInputDto
{
    [JsonPropertyName("category")] public AssetCategory Category { get; set; } = AssetCategory.Other;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("value")] public int Value { get; set; }
    [JsonPropertyName("owner")] public Owner Owner { get; set; } = Owner.Client;
    [JsonPropertyName("notes")] public string? Notes { get; set; }
}

public static class AssetMappingExtensions
{
    public static AssetDto ToDto(this ClientAsset a) => new()
    {
        Id = a.Id,
        ClientId = a.ClientId,
        Category = a.Category,
        Name = a.Name,
        Value = a.Value,
        Owner = a.Owner,
        Notes = a.Notes,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
    };
}
