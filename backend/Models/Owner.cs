namespace CrmApi.Models;

// Who a balance-sheet/insurance item belongs to. Income has its own narrower
// IncomeOwner (no Joint) — see ClientIncome.cs.
public enum Owner
{
    Client,
    Partner,
    Joint
}
