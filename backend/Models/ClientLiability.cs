namespace CrmApi.Models;

public enum LiabilityCategory
{
    Mortgage,
    InvestmentLoan,
    PersonalLoan,
    CreditCard,
    VehicleLoan,
    Other
}

public class ClientLiability : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public LiabilityCategory Category { get; set; } = LiabilityCategory.Other;
    public string Name { get; set; } = string.Empty;
    public int Balance { get; set; }
    public int? Limit { get; set; }
    // Basis points (550 = 5.50%) — matches the sveltekit schema's convention.
    public int? InterestRate { get; set; }
    public Owner Owner { get; set; } = Owner.Client;
    public string? Notes { get; set; }
}
