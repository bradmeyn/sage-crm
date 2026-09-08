using CrmApi.Services;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CrmApi.Filters;

/// <summary>
/// Every balance-sheet/cashflow/planning route is nested under
/// /api/clients/{clientId}/... and none of those sub-tables carry a
/// BusinessId of their own — ownership is only ever checked through the
/// parent Client. This used to be a private method copy-pasted into every
/// controller ("OwnsClientAsync"); centralising it here means the check
/// can't be forgotten on a new controller, and there's exactly one place
/// to fix if it's ever wrong.
///
/// An action filter, not middleware: it runs inside the MVC pipeline
/// *after* routing has bound {clientId} to a real Guid, so it can just
/// read ActionArguments instead of re-parsing raw route strings, and it
/// composes naturally with [Authorize] and constructor-injected services.
/// </summary>
public class ClientOwnershipFilter : IAsyncActionFilter
{
    private readonly IClientService _clientService;
    private readonly ICurrentUserService _currentUserService;

    public ClientOwnershipFilter(IClientService clientService, ICurrentUserService currentUserService)
    {
        _clientService = clientService;
        _currentUserService = currentUserService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.ActionArguments.TryGetValue("clientId", out var value) || value is not Guid clientId)
        {
            // Every action this filter is applied to takes a route-bound
            // Guid clientId — missing it is a wiring mistake, not a 404.
            throw new InvalidOperationException(
                $"{nameof(ClientOwnershipFilter)} requires a Guid 'clientId' action parameter.");
        }

        var client = await _clientService.GetClientByIdAsync(_currentUserService.BusinessId, clientId);
        if (client == null)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.NotFoundResult();
            return;
        }

        await next();
    }
}
