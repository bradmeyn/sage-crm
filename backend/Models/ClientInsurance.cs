namespace CrmApi.Models;

public enum InsuranceCategory
{
    Life,
    Tpd,
    Trauma,
    IncomeProtection,
    Health,
    HomeAndContents,
    Vehicle,
    Business,
    Other
}

// Narrower than the shared Frequency enum — premiums have no
// Weekly/Fortnightly option.
public enum PremiumFrequency
{
    Monthly,
    Quarterly,
    Annually
}

public enum InsuranceStatus
{
    Active,
    Pending,
    Lapsed,
    Cancelled
}

public class ClientInsurance : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public InsuranceCategory Category { get; set; } = InsuranceCategory.Other;
    public string Insurer { get; set; } = string.Empty;
    public string? PolicyNumber { get; set; }
    public int? CoverAmount { get; set; }
    public int? Premium { get; set; }
    public PremiumFrequency PremiumFrequency { get; set; } = PremiumFrequency.Monthly;
    public Owner Owner { get; set; } = Owner.Client;
    public InsuranceStatus Status { get; set; } = InsuranceStatus.Active;
    public DateOnly? StartDate { get; set; }
    public DateOnly? ReviewDate { get; set; }
    public string? Notes { get; set; }
}
