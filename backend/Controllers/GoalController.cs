using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Api.DTOs.Planning;
using CrmApi.Filters;
using CrmApi.Services;

[Authorize]
[ApiController]
[Route("api/clients/{clientId}/goals")]
[ServiceFilter(typeof(ClientOwnershipFilter))]
public class GoalController : ControllerBase
{
    private readonly IGoalService _goalService;

    public GoalController(IGoalService goalService)
    {
        _goalService = goalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetGoals(Guid clientId)
    {
        var goals = await _goalService.GetGoalsAsync(clientId);
        return Ok(goals.Select(g => g.ToDto()));
    }

    [HttpPost]
    public async Task<IActionResult> CreateGoal(Guid clientId, [FromBody] GoalInputDto dto)
    {
        var goal = await _goalService.CreateGoalAsync(clientId, dto);
        return Ok(goal.ToDto());
    }

    [HttpPut("{goalId}")]
    public async Task<IActionResult> UpdateGoal(Guid clientId, Guid goalId, [FromBody] GoalInputDto dto)
    {
        var updated = await _goalService.UpdateGoalAsync(clientId, goalId, dto);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{goalId}")]
    public async Task<IActionResult> DeleteGoal(Guid clientId, Guid goalId)
    {
        var deleted = await _goalService.DeleteGoalAsync(clientId, goalId);
        return deleted ? NoContent() : NotFound();
    }
}
