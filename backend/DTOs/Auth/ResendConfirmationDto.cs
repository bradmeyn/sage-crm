using System.ComponentModel.DataAnnotations;

public class ResendConfirmationDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
}