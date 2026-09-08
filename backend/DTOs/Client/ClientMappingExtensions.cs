namespace Api.DTOs.Client;

public static class ClientMappingExtensions
{
    public static ClientListDto ToListDto(this CrmApi.Models.Client client) => new()
    {
        Id = client.Id,
        FirstName = client.FirstName,
        LastName = client.LastName,
        PreferredName = client.PreferredName,
        Email = client.Email,
        Phone = client.Phone,
        Status = client.Status.ToString(),
        CreatedAt = client.CreatedAt,
    };

    public static ClientResponseDto ToResponseDto(this CrmApi.Models.Client client) => new()
    {
        Id = client.Id,
        Title = client.Title,
        FirstName = client.FirstName,
        MiddleName = client.MiddleName,
        LastName = client.LastName,
        PreferredName = client.PreferredName,
        Email = client.Email,
        Phone = client.Phone,
        DateOfBirth = client.DateOfBirth == DateOnly.MinValue ? null : client.DateOfBirth,
        Address = new AddressDto
        {
            Street = client.Street ?? string.Empty,
            Suburb = client.Suburb ?? string.Empty,
            State = client.State ?? string.Empty,
            PostCode = client.PostCode ?? string.Empty,
        },
        Gender = client.Gender,
        MaritalStatus = client.MaritalStatus,
        ResidencyStatus = client.ResidencyStatus,
        Occupation = client.Occupation,
        Employer = client.Employer,
        TaxFileNumber = client.TaxFileNumber,
        Smoker = client.Smoker,
        HealthStatus = client.HealthStatus,
        HeightCm = client.HeightCm,
        WeightKg = client.WeightKg,
        Status = client.Status.ToString(),
        LeadSource = client.LeadSource,
        IsVulnerable = client.IsVulnerable,
        VulnerabilityNote = client.VulnerabilityNote,
        QuickNote = client.QuickNote,
        PartnerId = client.PartnerId,
        PartnerRelationship = client.PartnerRelationship,
        BusinessId = client.BusinessId,
        CreatedAt = client.CreatedAt,
        UpdatedAt = client.UpdatedAt,
    };
}
