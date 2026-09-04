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
        FirstName = client.FirstName,
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
        Status = client.Status.ToString(),
        BusinessId = client.BusinessId,
        CreatedAt = client.CreatedAt,
        UpdatedAt = client.UpdatedAt,
    };
}
