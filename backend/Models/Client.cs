

namespace CrmApi.Models
{
    public class Client: BaseEntity
    {

        public string Title { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string PreferredName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateOnly DateOfBirth { get; set; } = DateOnly.MinValue;

        // Address
        public string? Street { get; set; }
        public string? Suburb { get; set; }
        public string? State { get; set; }
        public string? PostCode { get; set; }
        public string? Country { get; set; } = "Australia";

        // Personal
        public Gender? Gender { get; set; }
        public MaritalStatus? MaritalStatus { get; set; }
        public ResidencyStatus? ResidencyStatus { get; set; }

        // Employment
        public string? Occupation { get; set; }
        public string? Employer { get; set; }
        public string? TaxFileNumber { get; set; }

        // Health (feeds insurance underwriting)
        public bool? Smoker { get; set; }
        public HealthStatus? HealthStatus { get; set; }
        public int? HeightCm { get; set; }
        public int? WeightKg { get; set; }

         // Client Management
        public ClientStatus Status { get; set; } = ClientStatus.Prospect;
        public LeadSource? LeadSource { get; set; }
        public DateTime? ClientSince { get; set; }
        public DateTime? LastContactDate { get; set; }
        public DateTime? NextReviewDate { get; set; }
        public bool IsVulnerable { get; set; }
        public string? VulnerabilityNote { get; set; }
        public string? QuickNote { get; set; }

        // Associations
        public Guid BusinessId { get; set; }
        public Business Business { get; set; } = null!;
        public Guid? PrimaryAdvisorId { get; set; }
        public User? PrimaryAdvisor { get; set; }

        // A partner is just another Client row — same shape as sveltekit's
        // self-referencing partnerId. Set null on delete (a partner being
        // removed shouldn't take the other person's whole record with it).
        public Guid? PartnerId { get; set; }
        public Client? Partner { get; set; }
        public PartnerRelationship? PartnerRelationship { get; set; }
    }

    public enum ClientStatus
    {
        Prospect,      // Not yet a client
        Active,        // Current client
        Inactive,      // No longer actively managed
        Former         // Historical record
    }
}
