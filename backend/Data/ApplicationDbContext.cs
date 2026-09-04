
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


}

}