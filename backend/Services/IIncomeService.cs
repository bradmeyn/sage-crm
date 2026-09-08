using Api.DTOs.Financials;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

public interface IIncomeService
{
    Task<List<ClientIncome>> GetIncomeAsync(Guid clientId);
    Task<ClientIncome> CreateIncomeAsync(Guid clientId, IncomeInputDto dto);
    Task<bool> UpdateIncomeAsync(Guid clientId, Guid incomeId, IncomeInputDto dto);
    Task<bool> DeleteIncomeAsync(Guid clientId, Guid incomeId);
}

public class IncomeService : IIncomeService
{
    private readonly ApplicationDbContext _context;

    public IncomeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientIncome>> GetIncomeAsync(Guid clientId) =>
        await _context.ClientIncomes.Where(i => i.ClientId == clientId).ToListAsync();

    public async Task<ClientIncome> CreateIncomeAsync(Guid clientId, IncomeInputDto dto)
    {
        var income = new ClientIncome
        {
            ClientId = clientId,
            Category = dto.Category,
            Name = dto.Name,
            Amount = dto.Amount,
            Frequency = dto.Frequency,
            Owner = dto.Owner,
            Notes = dto.Notes,
        };
        _context.ClientIncomes.Add(income);
        await _context.SaveChangesAsync();
        return income;
    }

    public async Task<bool> UpdateIncomeAsync(Guid clientId, Guid incomeId, IncomeInputDto dto)
    {
        var income = await _context.ClientIncomes
            .FirstOrDefaultAsync(i => i.ClientId == clientId && i.Id == incomeId);
        if (income == null) return false;

        income.Category = dto.Category;
        income.Name = dto.Name;
        income.Amount = dto.Amount;
        income.Frequency = dto.Frequency;
        income.Owner = dto.Owner;
        income.Notes = dto.Notes;
        income.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteIncomeAsync(Guid clientId, Guid incomeId)
    {
        var income = await _context.ClientIncomes
            .FirstOrDefaultAsync(i => i.ClientId == clientId && i.Id == incomeId);
        if (income == null) return false;

        _context.ClientIncomes.Remove(income);
        await _context.SaveChangesAsync();
        return true;
    }
}
