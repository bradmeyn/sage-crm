namespace CrmApi.Models;

public enum IncomeCategory
{
    Employment,
    SelfEmployment,
    Investment,
    Rental,
    Superannuation,
    Government,
    Other
}

// Narrower than the shared Owner enum — income has no "Joint" option.
public enum IncomeOwner
{
    Client,
    Partner
}

public class ClientIncome : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public IncomeCategory Category { get; set; } = IncomeCategory.Other;
    public string Name { get; set; } = string.Empty;
    public int Amount { get; set; }
    public Frequency Frequency { get; set; } = Frequency.Annually;
    public IncomeOwner Owner { get; set; } = IncomeOwner.Client;
    public string? Notes { get; set; }
}
