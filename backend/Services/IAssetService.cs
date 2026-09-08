using Api.DTOs.Financials;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

public interface IAssetService
{
    Task<List<ClientAsset>> GetAssetsAsync(Guid clientId);
    Task<ClientAsset> CreateAssetAsync(Guid clientId, AssetInputDto dto);
    Task<bool> UpdateAssetAsync(Guid clientId, Guid assetId, AssetInputDto dto);
    Task<bool> DeleteAssetAsync(Guid clientId, Guid assetId);
}

public class AssetService : IAssetService
{
    private readonly ApplicationDbContext _context;

    public AssetService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientAsset>> GetAssetsAsync(Guid clientId) =>
        await _context.ClientAssets.Where(a => a.ClientId == clientId).ToListAsync();

    public async Task<ClientAsset> CreateAssetAsync(Guid clientId, AssetInputDto dto)
    {
        var asset = new ClientAsset
        {
            ClientId = clientId,
            Category = dto.Category,
            Name = dto.Name,
            Value = dto.Value,
            Owner = dto.Owner,
            Notes = dto.Notes,
        };
        _context.ClientAssets.Add(asset);
        await _context.SaveChangesAsync();
        return asset;
    }

    public async Task<bool> UpdateAssetAsync(Guid clientId, Guid assetId, AssetInputDto dto)
    {
        var asset = await _context.ClientAssets
            .FirstOrDefaultAsync(a => a.ClientId == clientId && a.Id == assetId);
        if (asset == null) return false;

        asset.Category = dto.Category;
        asset.Name = dto.Name;
        asset.Value = dto.Value;
        asset.Owner = dto.Owner;
        asset.Notes = dto.Notes;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAssetAsync(Guid clientId, Guid assetId)
    {
        var asset = await _context.ClientAssets
            .FirstOrDefaultAsync(a => a.ClientId == clientId && a.Id == assetId);
        if (asset == null) return false;

        _context.ClientAssets.Remove(asset);
        await _context.SaveChangesAsync();
        return true;
    }
}
