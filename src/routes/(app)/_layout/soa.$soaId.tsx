import { createFileRoute } from "@tanstack/react-router";
import { getSoa } from "@/server/functions/soa";
import { soaKeys } from "@/features/soa/hooks";
import SoaBuilder from "@/features/soa/components/soa-builder";

export const Route = createFileRoute("/(app)/_layout/soa/$soaId")({
  component: BuilderPage,
  loader: async ({ params: { soaId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: soaKeys.detail(soaId),
      queryFn: () => getSoa({ data: { soaId } }),
    });
    return { soaId };
  },
});

function BuilderPage() {
  const { soaId } = Route.useLoaderData();
  return <SoaBuilder soaId={soaId} />;
}
