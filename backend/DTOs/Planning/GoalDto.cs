using System.Text.Json.Serialization;
using CrmApi.Models;

namespace Api.DTOs.Planning;

public class GoalDto
{
    [JsonPropertyName("id")] public Guid Id { get; set; }
    [JsonPropertyName("clientId")] public Guid ClientId { get; set; }
    [JsonPropertyName("category")] public GoalCategory Category { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("targetAmount")] public int? TargetAmount { get; set; }
    [JsonPropertyName("currentAmount")] public int CurrentAmount { get; set; }
    [JsonPropertyName("targetDate")] public DateOnly? TargetDate { get; set; }
    [JsonPropertyName("priority")] public GoalPriority Priority { get; set; }
    [JsonPropertyName("status")] public GoalStatus Status { get; set; }
    [JsonPropertyName("notes")] public string? Notes { get; set; }
    [JsonPropertyName("createdAt")] public DateTime CreatedAt { get; set; }
    [JsonPropertyName("updatedAt")] public DateTime UpdatedAt { get; set; }
}

public class GoalInputDto
{
    [JsonPropertyName("category")] public GoalCategory Category { get; set; } = GoalCategory.Other;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("targetAmount")] public int? TargetAmount { get; set; }
    [JsonPropertyName("currentAmount")] public int CurrentAmount { get; set; }
    [JsonPropertyName("targetDate")] public DateOnly? TargetDate { get; set; }
    [JsonPropertyName("priority")] public GoalPriority Priority { get; set; } = GoalPriority.Medium;
    [JsonPropertyName("status")] public GoalStatus Status { get; set; } = GoalStatus.Active;
    [JsonPropertyName("notes")] public string? Notes { get; set; }
}

public static class GoalMappingExtensions
{
    public static GoalDto ToDto(this ClientGoal g) => new()
    {
        Id = g.Id,
        ClientId = g.ClientId,
        Category = g.Category,
        Name = g.Name,
        TargetAmount = g.TargetAmount,
        CurrentAmount = g.CurrentAmount,
        TargetDate = g.TargetDate,
        Priority = g.Priority,
        Status = g.Status,
        Notes = g.Notes,
        CreatedAt = g.CreatedAt,
        UpdatedAt = g.UpdatedAt,
    };
}
