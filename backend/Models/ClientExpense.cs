namespace CrmApi.Models;

public enum ExpenseCategory
{
    Housing,
    Living,
    Transport,
    Insurance,
    Utilities,
    Healthcare,
    Education,
    Entertainment,
    Other
}

public class ClientExpense : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;
    public string Name { get; set; } = string.Empty;
    public int Amount { get; set; }
    public Frequency Frequency { get; set; } = Frequency.Monthly;
    public string? Notes { get; set; }
}
