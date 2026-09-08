using Api.DTOs.Financials;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

public interface IExpenseService
{
    Task<List<ClientExpense>> GetExpensesAsync(Guid clientId);
    Task<ClientExpense> CreateExpenseAsync(Guid clientId, ExpenseInputDto dto);
    Task<bool> UpdateExpenseAsync(Guid clientId, Guid expenseId, ExpenseInputDto dto);
    Task<bool> DeleteExpenseAsync(Guid clientId, Guid expenseId);
}

public class ExpenseService : IExpenseService
{
    private readonly ApplicationDbContext _context;

    public ExpenseService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientExpense>> GetExpensesAsync(Guid clientId) =>
        await _context.ClientExpenses.Where(e => e.ClientId == clientId).ToListAsync();

    public async Task<ClientExpense> CreateExpenseAsync(Guid clientId, ExpenseInputDto dto)
    {
        var expense = new ClientExpense
        {
            ClientId = clientId,
            Category = dto.Category,
            Name = dto.Name,
            Amount = dto.Amount,
            Frequency = dto.Frequency,
            Notes = dto.Notes,
        };
        _context.ClientExpenses.Add(expense);
        await _context.SaveChangesAsync();
        return expense;
    }

    public async Task<bool> UpdateExpenseAsync(Guid clientId, Guid expenseId, ExpenseInputDto dto)
    {
        var expense = await _context.ClientExpenses
            .FirstOrDefaultAsync(e => e.ClientId == clientId && e.Id == expenseId);
        if (expense == null) return false;

        expense.Category = dto.Category;
        expense.Name = dto.Name;
        expense.Amount = dto.Amount;
        expense.Frequency = dto.Frequency;
        expense.Notes = dto.Notes;
        expense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteExpenseAsync(Guid clientId, Guid expenseId)
    {
        var expense = await _context.ClientExpenses
            .FirstOrDefaultAsync(e => e.ClientId == clientId && e.Id == expenseId);
        if (expense == null) return false;

        _context.ClientExpenses.Remove(expense);
        await _context.SaveChangesAsync();
        return true;
    }
}
