import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getFactFind } from "@/server/functions/fact-find";
import { factFindKeys } from "@/features/clients/fact-find/hooks";
import RunFactFind from "@/features/clients/fact-find/run/run-fact-find";

export const Route = createFileRoute("/(app)/_layout/fact-find/$clientId")({
  validateSearch: z.object({ section: z.string().optional() }),
  component: RunPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: factFindKeys.detail(clientId),
      queryFn: () => getFactFind({ data: { clientId } }),
    });
    return { clientId };
  },
});

function RunPage() {
  const { clientId } = Route.useLoaderData();
  const { section } = Route.useSearch();
  return <RunFactFind clientId={clientId} initialSection={section} />;
}
