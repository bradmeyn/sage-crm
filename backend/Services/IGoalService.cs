using Api.DTOs.Planning;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

public interface IGoalService
{
    Task<List<ClientGoal>> GetGoalsAsync(Guid clientId);
    Task<ClientGoal> CreateGoalAsync(Guid clientId, GoalInputDto dto);
    Task<bool> UpdateGoalAsync(Guid clientId, Guid goalId, GoalInputDto dto);
    Task<bool> DeleteGoalAsync(Guid clientId, Guid goalId);
}

public class GoalService : IGoalService
{
    private readonly ApplicationDbContext _context;

    public GoalService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientGoal>> GetGoalsAsync(Guid clientId) =>
        await _context.ClientGoals.Where(g => g.ClientId == clientId).ToListAsync();

    public async Task<ClientGoal> CreateGoalAsync(Guid clientId, GoalInputDto dto)
    {
        var goal = new ClientGoal
        {
            ClientId = clientId,
            Category = dto.Category,
            Name = dto.Name,
            TargetAmount = dto.TargetAmount,
            CurrentAmount = dto.CurrentAmount,
            TargetDate = dto.TargetDate,
            Priority = dto.Priority,
            Status = dto.Status,
            Notes = dto.Notes,
        };
        _context.ClientGoals.Add(goal);
        await _context.SaveChangesAsync();
        return goal;
    }

    public async Task<bool> UpdateGoalAsync(Guid clientId, Guid goalId, GoalInputDto dto)
    {
        var goal = await _context.ClientGoals
            .FirstOrDefaultAsync(g => g.ClientId == clientId && g.Id == goalId);
        if (goal == null) return false;

        goal.Category = dto.Category;
        goal.Name = dto.Name;
        goal.TargetAmount = dto.TargetAmount;
        goal.CurrentAmount = dto.CurrentAmount;
        goal.TargetDate = dto.TargetDate;
        goal.Priority = dto.Priority;
        goal.Status = dto.Status;
        goal.Notes = dto.Notes;
        goal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteGoalAsync(Guid clientId, Guid goalId)
    {
        var goal = await _context.ClientGoals
            .FirstOrDefaultAsync(g => g.ClientId == clientId && g.Id == goalId);
        if (goal == null) return false;

        _context.ClientGoals.Remove(goal);
        await _context.SaveChangesAsync();
        return true;
    }
}
