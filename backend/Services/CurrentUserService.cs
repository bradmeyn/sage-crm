
using System.Security.Claims;

namespace CrmApi.Services;

public interface ICurrentUserService
{
    public Guid UserId {get;}
    public Guid BusinessId {get;}
    public bool IsAuthenticated {get;}
}

public class CurrentUserService: ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

     private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid UserId => Guid.Parse(
        User?.FindFirstValue("sub") 
        ?? User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User ID not found"));

    public Guid BusinessId => Guid.Parse(
        User?.FindFirstValue("businessId") 
        ?? throw new UnauthorizedAccessException("Business ID not found"));
}