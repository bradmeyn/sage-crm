using Api.DTOs.Planning;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

public interface IInsuranceService
{
    Task<List<ClientInsurance>> GetInsuranceAsync(Guid clientId);
    Task<ClientInsurance> CreateInsuranceAsync(Guid clientId, InsuranceInputDto dto);
    Task<bool> UpdateInsuranceAsync(Guid clientId, Guid insuranceId, InsuranceInputDto dto);
    Task<bool> DeleteInsuranceAsync(Guid clientId, Guid insuranceId);
}

public class InsuranceService : IInsuranceService
{
    private readonly ApplicationDbContext _context;

    public InsuranceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientInsurance>> GetInsuranceAsync(Guid clientId) =>
        await _context.ClientInsurances.Where(i => i.ClientId == clientId).ToListAsync();

    public async Task<ClientInsurance> CreateInsuranceAsync(Guid clientId, InsuranceInputDto dto)
    {
        var insurance = new ClientInsurance
        {
            ClientId = clientId,
            Category = dto.Category,
            Insurer = dto.Insurer,
            PolicyNumber = dto.PolicyNumber,
            CoverAmount = dto.CoverAmount,
            Premium = dto.Premium,
            PremiumFrequency = dto.PremiumFrequency,
            Owner = dto.Owner,
            Status = dto.Status,
            StartDate = dto.StartDate,
            ReviewDate = dto.ReviewDate,
            Notes = dto.Notes,
        };
        _context.ClientInsurances.Add(insurance);
        await _context.SaveChangesAsync();
        return insurance;
    }

    public async Task<bool> UpdateInsuranceAsync(Guid clientId, Guid insuranceId, InsuranceInputDto dto)
    {
        var insurance = await _context.ClientInsurances
            .FirstOrDefaultAsync(i => i.ClientId == clientId && i.Id == insuranceId);
        if (insurance == null) return false;

        insurance.Category = dto.Category;
        insurance.Insurer = dto.Insurer;
        insurance.PolicyNumber = dto.PolicyNumber;
        insurance.CoverAmount = dto.CoverAmount;
        insurance.Premium = dto.Premium;
        insurance.PremiumFrequency = dto.PremiumFrequency;
        insurance.Owner = dto.Owner;
        insurance.Status = dto.Status;
        insurance.StartDate = dto.StartDate;
        insurance.ReviewDate = dto.ReviewDate;
        insurance.Notes = dto.Notes;
        insurance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteInsuranceAsync(Guid clientId, Guid insuranceId)
    {
        var insurance = await _context.ClientInsurances
            .FirstOrDefaultAsync(i => i.ClientId == clientId && i.Id == insuranceId);
        if (insurance == null) return false;

        _context.ClientInsurances.Remove(insurance);
        await _context.SaveChangesAsync();
        return true;
    }
}
