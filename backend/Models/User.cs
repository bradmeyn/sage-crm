using Microsoft.AspNetCore.Identity;


namespace CrmApi.Models
{
    public class User : IdentityUser<Guid>
    {

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        public Guid BusinessId { get; set; }
        public Business Business { get; set; } = null!;

    }
}