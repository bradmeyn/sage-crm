
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CrmApi.Models;
using Microsoft.AspNetCore.Identity;

namespace CrmApi.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {}

    // Users DBset comes from IdentityDbContext
    public DbSet<Business> Businesses { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<FileNote> FileNotes { get; set; }
    public DbSet<FileNoteDocument> FileNoteDocuments {get; set;}

    // Balance sheet / cashflow / planning sub-tables. None of these carry a
    // BusinessId — ownership is inherited through ClientId, so every
    // controller/service that touches them must verify the parent Client
    // belongs to the caller's Business first (see ClientController's own
    // ownership check for the pattern each of these follows).
    public DbSet<ClientAsset> ClientAssets { get; set; }
    public DbSet<ClientLiability> ClientLiabilities { get; set; }
    public DbSet<ClientIncome> ClientIncomes { get; set; }
    public DbSet<ClientExpense> ClientExpenses { get; set; }
    public DbSet<ClientGoal> ClientGoals { get; set; }
    public DbSet<ClientInsurance> ClientInsurances { get; set; }

  protected override void OnModelCreating(ModelBuilder builder)
{
    base.OnModelCreating(builder);

    builder.Entity<Business>(entity =>
    {

        entity.HasMany(b => b.Users)
              .WithOne(u => u.Business)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(b => b.Clients)
              .WithOne(c => c.Business)
              .OnDelete(DeleteBehavior.Cascade);
    });

    builder.Entity<Client>(entity =>
    {
        // Self-referencing partner link — set null on delete, matching the
        // sveltekit schema's onDelete: 'set null'. A partner being removed
        // shouldn't cascade into deleting the other person's record.
        entity.HasOne(c => c.Partner)
              .WithMany()
              .HasForeignKey(c => c.PartnerId)
              .OnDelete(DeleteBehavior.SetNull);
    });

    // Balance sheet / cashflow / planning: cascade delete with the parent
    // Client, same as the sveltekit schema's onDelete: 'cascade'.
    builder.Entity<ClientAsset>()
        .HasOne(a => a.Client).WithMany().HasForeignKey(a => a.ClientId).OnDelete(DeleteBehavior.Cascade);
    builder.Entity<ClientLiability>()
        .HasOne(l => l.Client).WithMany().HasForeignKey(l => l.ClientId).OnDelete(DeleteBehavior.Cascade);
    builder.Entity<ClientIncome>()
        .HasOne(i => i.Client).WithMany().HasForeignKey(i => i.ClientId).OnDelete(DeleteBehavior.Cascade);
    builder.Entity<ClientExpense>()
        .HasOne(e => e.Client).WithMany().HasForeignKey(e => e.ClientId).OnDelete(DeleteBehavior.Cascade);
    builder.Entity<ClientGoal>()
        .HasOne(g => g.Client).WithMany().HasForeignKey(g => g.ClientId).OnDelete(DeleteBehavior.Cascade);
    builder.Entity<ClientInsurance>()
        .HasOne(i => i.Client).WithMany().HasForeignKey(i => i.ClientId).OnDelete(DeleteBehavior.Cascade);
}

}
