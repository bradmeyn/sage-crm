using Api.DTOs.Client;
using CrmApi.Models;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

public interface IClientService
{
    Task<List<Client>> GetClientsAsync(Guid businessId);
    Task<Client?> GetClientByIdAsync(Guid businessId, Guid clientId);
    Task<Client> CreateClientAsync(Guid businessId, CreateClientDto dto);
    Task<bool> UpdateClientAsync(Guid businessId, Guid clientId, UpdateClientDto dto);
    Task<bool> DeleteClientAsync(Guid businessId, Guid clientId);
    Task<bool> LinkPartnerAsync(Guid businessId, Guid clientId, Guid partnerId, PartnerRelationship relationship);
    Task<bool> UnlinkPartnerAsync(Guid businessId, Guid clientId);
}

public class ClientService : IClientService
{
    private readonly ApplicationDbContext _context;

    public ClientService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Client>> GetClientsAsync(Guid businessId)
    {
        return await _context.Clients
            .Where(c => c.BusinessId == businessId)
            .ToListAsync();
    }

    public async Task<Client?> GetClientByIdAsync(Guid businessId, Guid clientId)
    {
        return await _context.Clients
            .FirstOrDefaultAsync(c => c.BusinessId == businessId && c.Id == clientId);
    }

    public async Task<Client> CreateClientAsync(Guid businessId, CreateClientDto dto)
    {
        var client = new Client
        {
            Title = dto.Title,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            PreferredName = dto.PreferredName,
            Email = dto.Email,
            Phone = dto.Phone ?? string.Empty,
            DateOfBirth = dto.DateOfBirth ?? DateOnly.MinValue,
            Street = dto.Address?.Street,
            Suburb = dto.Address?.Suburb,
            State = dto.Address?.State,
            PostCode = dto.Address?.PostCode,
            BusinessId = businessId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();
        return client;
    }

    // Every field here is a straight assignment from the edit form's DTO — no
    // null-coalescing against the existing row. This is a full-form edit, not
    // a partial patch, so a blank field means "clear it", not "leave it".
    // (An earlier version tried to merge field-by-field and quietly dropped
    // whatever it forgot to list — Status/DateOfBirth, twice.)
    public async Task<bool> UpdateClientAsync(Guid businessId, Guid clientId, UpdateClientDto dto)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.BusinessId == businessId && c.Id == clientId);
        if (client == null) return false;

        client.Title = dto.Title;
        client.FirstName = dto.FirstName;
        client.MiddleName = dto.MiddleName;
        client.LastName = dto.LastName;
        client.PreferredName = dto.PreferredName;
        client.Email = dto.Email;
        client.Phone = dto.Phone ?? string.Empty;
        client.DateOfBirth = dto.DateOfBirth ?? DateOnly.MinValue;
        client.Street = dto.Address?.Street;
        client.Suburb = dto.Address?.Suburb;
        client.State = dto.Address?.State;
        client.PostCode = dto.Address?.PostCode;

        client.Gender = dto.Gender;
        client.MaritalStatus = dto.MaritalStatus;
        client.ResidencyStatus = dto.ResidencyStatus;

        client.Occupation = dto.Occupation;
        client.Employer = dto.Employer;
        client.TaxFileNumber = dto.TaxFileNumber;

        client.Smoker = dto.Smoker;
        client.HealthStatus = dto.HealthStatus;
        client.HeightCm = dto.HeightCm;
        client.WeightKg = dto.WeightKg;

        client.Status = dto.Status;
        client.LeadSource = dto.LeadSource;
        client.IsVulnerable = dto.IsVulnerable;
        client.VulnerabilityNote = dto.VulnerabilityNote;
        client.QuickNote = dto.QuickNote;

        client.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteClientAsync(Guid businessId, Guid clientId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.BusinessId == businessId && c.Id == clientId);

        if (client == null) return false;

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();
        return true;
    }

    // Partner linking is its own action rather than a field on the general edit
    // form — same split as sveltekit's separate linkPartnerSchema/remote.
    public async Task<bool> LinkPartnerAsync(Guid businessId, Guid clientId, Guid partnerId, PartnerRelationship relationship)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.BusinessId == businessId && c.Id == clientId);
        var partner = await _context.Clients
            .FirstOrDefaultAsync(c => c.BusinessId == businessId && c.Id == partnerId);
        if (client == null || partner == null || client.Id == partner.Id) return false;

        client.PartnerId = partner.Id;
        client.PartnerRelationship = relationship;
        client.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UnlinkPartnerAsync(Guid businessId, Guid clientId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.BusinessId == businessId && c.Id == clientId);
        if (client == null) return false;

        client.PartnerId = null;
        client.PartnerRelationship = null;
        client.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
