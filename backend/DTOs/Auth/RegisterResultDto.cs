namespace CrmApi.DTOs.Auth;

public class RegisterResultDto
{
    public Guid UserId { get; set; }
    public Guid BusinessId { get; set; }
    public bool EmailSent { get; set; }
}
