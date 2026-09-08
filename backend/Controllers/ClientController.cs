using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Api.DTOs.Client;
using CrmApi.Services;


[Authorize]
[ApiController]
[Route("api/clients")]

public class ClientController : ControllerBase
{
    private readonly IClientService _clientService;
    private readonly ILogger<ClientController> _logger;
    private readonly ICurrentUserService _currentUserService;


    public ClientController(
        IClientService clientService,
        ICurrentUserService currentUserService,
        ILogger<ClientController> logger
    )
    {
        _clientService = clientService;
        _logger = logger;
        _currentUserService = currentUserService;
    }

 [HttpGet]
    public async Task<IActionResult> GetClients()
    {
        var clients = await _clientService.GetClientsAsync(_currentUserService.BusinessId);
        return Ok(clients.Select(c => c.ToListDto()));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetClientById(Guid id)
    {
        var client = await _clientService.GetClientByIdAsync(_currentUserService.BusinessId, id);
        if (client == null) return NotFound();
        return Ok(client.ToResponseDto());
    }

    [HttpPost]
    public async Task<IActionResult> CreateClient([FromBody] CreateClientDto dto)
    {
        var createdClient = await _clientService.CreateClientAsync(_currentUserService.BusinessId, dto);
        return CreatedAtAction(nameof(GetClientById), new { id = createdClient.Id }, createdClient.ToResponseDto());
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClient(Guid id, [FromBody] UpdateClientDto dto)
    {
        var updated = await _clientService.UpdateClientAsync(_currentUserService.BusinessId, id, dto);
        if (!updated) return NotFound();

        var updatedClient = await _clientService.GetClientByIdAsync(_currentUserService.BusinessId, id);
        return Ok(updatedClient!.ToResponseDto());
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClient(Guid id)
    {
        var deleted = await _clientService.DeleteClientAsync(_currentUserService.BusinessId, id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/partner")]
    public async Task<IActionResult> LinkPartner(Guid id, [FromBody] LinkPartnerDto dto)
    {
        var linked = await _clientService.LinkPartnerAsync(_currentUserService.BusinessId, id, dto.PartnerId, dto.Relationship);
        if (!linked) return NotFound();

        var client = await _clientService.GetClientByIdAsync(_currentUserService.BusinessId, id);
        return Ok(client!.ToResponseDto());
    }

    [HttpDelete("{id}/partner")]
    public async Task<IActionResult> UnlinkPartner(Guid id)
    {
        var unlinked = await _clientService.UnlinkPartnerAsync(_currentUserService.BusinessId, id);
        if (!unlinked) return NotFound();
        return NoContent();
    }
}
