import { createFileRoute } from "@tanstack/react-router";
import { getFactFind } from "@/server/functions/fact-find";
import { factFindKeys } from "@/features/clients/fact-find/hooks";
import FactFindShell from "@/features/clients/fact-find/components/fact-find-shell";

export const Route = createFileRoute(
  "/(app)/_layout/clients/$clientId/fact-find/",
)({
  component: FactFindPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: factFindKeys.detail(clientId),
      queryFn: () => getFactFind({ data: { clientId } }),
    });
    return { clientId };
  },
});

function FactFindPage() {
  const { clientId } = Route.useLoaderData();
  return <FactFindShell clientId={clientId} />;
}
