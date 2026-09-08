namespace CrmApi.Models;

// Income/expense recurrence. Insurance premiums use the narrower
// PremiumFrequency (no Weekly/Fortnightly) — see ClientInsurance.cs.
public enum Frequency
{
    Weekly,
    Fortnightly,
    Monthly,
    Quarterly,
    Annually
}
