using Api.DTOs.Financials;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

public interface ILiabilityService
{
    Task<List<ClientLiability>> GetLiabilitiesAsync(Guid clientId);
    Task<ClientLiability> CreateLiabilityAsync(Guid clientId, LiabilityInputDto dto);
    Task<bool> UpdateLiabilityAsync(Guid clientId, Guid liabilityId, LiabilityInputDto dto);
    Task<bool> DeleteLiabilityAsync(Guid clientId, Guid liabilityId);
}

public class LiabilityService : ILiabilityService
{
    private readonly ApplicationDbContext _context;

    public LiabilityService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientLiability>> GetLiabilitiesAsync(Guid clientId) =>
        await _context.ClientLiabilities.Where(l => l.ClientId == clientId).ToListAsync();

    public async Task<ClientLiability> CreateLiabilityAsync(Guid clientId, LiabilityInputDto dto)
    {
        var liability = new ClientLiability
        {
            ClientId = clientId,
            Category = dto.Category,
            Name = dto.Name,
            Balance = dto.Balance,
            Limit = dto.Limit,
            InterestRate = dto.InterestRate,
            Owner = dto.Owner,
            Notes = dto.Notes,
        };
        _context.ClientLiabilities.Add(liability);
        await _context.SaveChangesAsync();
        return liability;
    }

    public async Task<bool> UpdateLiabilityAsync(Guid clientId, Guid liabilityId, LiabilityInputDto dto)
    {
        var liability = await _context.ClientLiabilities
            .FirstOrDefaultAsync(l => l.ClientId == clientId && l.Id == liabilityId);
        if (liability == null) return false;

        liability.Category = dto.Category;
        liability.Name = dto.Name;
        liability.Balance = dto.Balance;
        liability.Limit = dto.Limit;
        liability.InterestRate = dto.InterestRate;
        liability.Owner = dto.Owner;
        liability.Notes = dto.Notes;
        liability.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteLiabilityAsync(Guid clientId, Guid liabilityId)
    {
        var liability = await _context.ClientLiabilities
            .FirstOrDefaultAsync(l => l.ClientId == clientId && l.Id == liabilityId);
        if (liability == null) return false;

        _context.ClientLiabilities.Remove(liability);
        await _context.SaveChangesAsync();
        return true;
    }
}
