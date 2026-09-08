
namespace CrmApi.Models;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Defaulted here, not left to each service to remember on insert — the
    // six new sub-resource services (Asset/Liability/Income/Expense/Goal/
    // Insurance) all skipped setting these explicitly and shipped
    // 0001-01-01 timestamps until this default was added.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedById { get; set; }
    public Guid UpdatedById { get; set; }
}