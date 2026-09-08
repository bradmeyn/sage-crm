using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Api.DTOs.Financials;
using CrmApi.Filters;
using CrmApi.Services;

// Grouped by domain (assets + liabilities), not by table — mirrors
// sveltekit's balance-sheet.remote.ts covering both client_asset and
// client_liability. ClientOwnershipFilter runs before every action here:
// these sub-tables carry no BusinessId of their own, so ownership is only
// ever checked through the parent Client.
[Authorize]
[ApiController]
[Route("api/clients/{clientId}")]
[ServiceFilter(typeof(ClientOwnershipFilter))]
public class BalanceSheetController : ControllerBase
{
    private readonly IAssetService _assetService;
    private readonly ILiabilityService _liabilityService;

    public BalanceSheetController(IAssetService assetService, ILiabilityService liabilityService)
    {
        _assetService = assetService;
        _liabilityService = liabilityService;
    }

    // ─── Assets ──────────────────────────────────────────────────────────

    [HttpGet("assets")]
    public async Task<IActionResult> GetAssets(Guid clientId)
    {
        var assets = await _assetService.GetAssetsAsync(clientId);
        return Ok(assets.Select(a => a.ToDto()));
    }

    [HttpPost("assets")]
    public async Task<IActionResult> CreateAsset(Guid clientId, [FromBody] AssetInputDto dto)
    {
        var asset = await _assetService.CreateAssetAsync(clientId, dto);
        return Ok(asset.ToDto());
    }

    [HttpPut("assets/{assetId}")]
    public async Task<IActionResult> UpdateAsset(Guid clientId, Guid assetId, [FromBody] AssetInputDto dto)
    {
        var updated = await _assetService.UpdateAssetAsync(clientId, assetId, dto);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("assets/{assetId}")]
    public async Task<IActionResult> DeleteAsset(Guid clientId, Guid assetId)
    {
        var deleted = await _assetService.DeleteAssetAsync(clientId, assetId);
        return deleted ? NoContent() : NotFound();
    }

    // ─── Liabilities ─────────────────────────────────────────────────────

    [HttpGet("liabilities")]
    public async Task<IActionResult> GetLiabilities(Guid clientId)
    {
        var liabilities = await _liabilityService.GetLiabilitiesAsync(clientId);
        return Ok(liabilities.Select(l => l.ToDto()));
    }

    [HttpPost("liabilities")]
    public async Task<IActionResult> CreateLiability(Guid clientId, [FromBody] LiabilityInputDto dto)
    {
        var liability = await _liabilityService.CreateLiabilityAsync(clientId, dto);
        return Ok(liability.ToDto());
    }

    [HttpPut("liabilities/{liabilityId}")]
    public async Task<IActionResult> UpdateLiability(Guid clientId, Guid liabilityId, [FromBody] LiabilityInputDto dto)
    {
        var updated = await _liabilityService.UpdateLiabilityAsync(clientId, liabilityId, dto);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("liabilities/{liabilityId}")]
    public async Task<IActionResult> DeleteLiability(Guid clientId, Guid liabilityId)
    {
        var deleted = await _liabilityService.DeleteLiabilityAsync(clientId, liabilityId);
        return deleted ? NoContent() : NotFound();
    }
}
