using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Api.DTOs.Planning;
using CrmApi.Filters;
using CrmApi.Services;

[Authorize]
[ApiController]
[Route("api/clients/{clientId}/insurance")]
[ServiceFilter(typeof(ClientOwnershipFilter))]
public class InsuranceController : ControllerBase
{
    private readonly IInsuranceService _insuranceService;

    public InsuranceController(IInsuranceService insuranceService)
    {
        _insuranceService = insuranceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInsurance(Guid clientId)
    {
        var insurance = await _insuranceService.GetInsuranceAsync(clientId);
        return Ok(insurance.Select(i => i.ToDto()));
    }

    [HttpPost]
    public async Task<IActionResult> CreateInsurance(Guid clientId, [FromBody] InsuranceInputDto dto)
    {
        var insurance = await _insuranceService.CreateInsuranceAsync(clientId, dto);
        return Ok(insurance.ToDto());
    }

    [HttpPut("{insuranceId}")]
    public async Task<IActionResult> UpdateInsurance(Guid clientId, Guid insuranceId, [FromBody] InsuranceInputDto dto)
    {
        var updated = await _insuranceService.UpdateInsuranceAsync(clientId, insuranceId, dto);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{insuranceId}")]
    public async Task<IActionResult> DeleteInsurance(Guid clientId, Guid insuranceId)
    {
        var deleted = await _insuranceService.DeleteInsuranceAsync(clientId, insuranceId);
        return deleted ? NoContent() : NotFound();
    }
}
