namespace CrmApi.Models;

public enum GoalCategory
{
    Retirement,
    Education,
    Property,
    EmergencyFund,
    DebtFree,
    Business,
    Travel,
    Other
}

public enum GoalStatus
{
    Active,
    Achieved,
    OnHold,
    Cancelled
}

public enum GoalPriority
{
    High,
    Medium,
    Low
}

public class ClientGoal : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public GoalCategory Category { get; set; } = GoalCategory.Other;
    public string Name { get; set; } = string.Empty;
    public int? TargetAmount { get; set; }
    public int CurrentAmount { get; set; }
    public DateOnly? TargetDate { get; set; }
    public GoalPriority Priority { get; set; } = GoalPriority.Medium;
    public GoalStatus Status { get; set; } = GoalStatus.Active;
    public string? Notes { get; set; }
}
