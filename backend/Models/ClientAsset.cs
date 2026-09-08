namespace CrmApi.Models;

public enum AssetCategory
{
    CashAndBank,
    Property,
    Investment,
    Superannuation,
    Vehicle,
    Business,
    Other
}

// Balance-sheet sub-table. No BusinessId — scope is inherited through
// ClientId (see ClientController's ownership check, mirrored by every
// controller that touches these sub-resources).
public class ClientAsset : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public AssetCategory Category { get; set; } = AssetCategory.Other;
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public Owner Owner { get; set; } = Owner.Client;
    public string? Notes { get; set; }
}
