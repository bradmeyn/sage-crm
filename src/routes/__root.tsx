import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import TanStackQueryProvider from "@/integrations/tanstack-query/root-provider";
import appCss from "@/styles.css?url";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sage" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext();
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TanStackQueryProvider queryClient={queryClient}>
          {children}
          <Toaster position="top-right" />
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  );
}

export function DefaultComponent() {
  return <Outlet />;
}
