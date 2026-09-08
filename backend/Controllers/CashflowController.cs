using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Api.DTOs.Financials;
using CrmApi.Filters;
using CrmApi.Services;

// Grouped by domain (income + expenses), mirroring sveltekit's cashflow.remote.ts.
[Authorize]
[ApiController]
[Route("api/clients/{clientId}")]
[ServiceFilter(typeof(ClientOwnershipFilter))]
public class CashflowController : ControllerBase
{
    private readonly IIncomeService _incomeService;
    private readonly IExpenseService _expenseService;

    public CashflowController(IIncomeService incomeService, IExpenseService expenseService)
    {
        _incomeService = incomeService;
        _expenseService = expenseService;
    }

    // ─── Income ──────────────────────────────────────────────────────────

    [HttpGet("income")]
    public async Task<IActionResult> GetIncome(Guid clientId)
    {
        var income = await _incomeService.GetIncomeAsync(clientId);
        return Ok(income.Select(i => i.ToDto()));
    }

    [HttpPost("income")]
    public async Task<IActionResult> CreateIncome(Guid clientId, [FromBody] IncomeInputDto dto)
    {
        var income = await _incomeService.CreateIncomeAsync(clientId, dto);
        return Ok(income.ToDto());
    }

    [HttpPut("income/{incomeId}")]
    public async Task<IActionResult> UpdateIncome(Guid clientId, Guid incomeId, [FromBody] IncomeInputDto dto)
    {
        var updated = await _incomeService.UpdateIncomeAsync(clientId, incomeId, dto);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("income/{incomeId}")]
    public async Task<IActionResult> DeleteIncome(Guid clientId, Guid incomeId)
    {
        var deleted = await _incomeService.DeleteIncomeAsync(clientId, incomeId);
        return deleted ? NoContent() : NotFound();
    }

    // ─── Expenses ────────────────────────────────────────────────────────

    [HttpGet("expenses")]
    public async Task<IActionResult> GetExpenses(Guid clientId)
    {
        var expenses = await _expenseService.GetExpensesAsync(clientId);
        return Ok(expenses.Select(e => e.ToDto()));
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> CreateExpense(Guid clientId, [FromBody] ExpenseInputDto dto)
    {
        var expense = await _expenseService.CreateExpenseAsync(clientId, dto);
        return Ok(expense.ToDto());
    }

    [HttpPut("expenses/{expenseId}")]
    public async Task<IActionResult> UpdateExpense(Guid clientId, Guid expenseId, [FromBody] ExpenseInputDto dto)
    {
        var updated = await _expenseService.UpdateExpenseAsync(clientId, expenseId, dto);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("expenses/{expenseId}")]
    public async Task<IActionResult> DeleteExpense(Guid clientId, Guid expenseId)
    {
        var deleted = await _expenseService.DeleteExpenseAsync(clientId, expenseId);
        return deleted ? NoContent() : NotFound();
    }
}
