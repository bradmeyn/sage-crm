import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  checkFactFindToken,
  openFactFind,
} from "@/server/functions/fact-find-portal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/loading-spinner";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import ClientFactFindForm from "@/features/clients/fact-find/components/client-fact-find-form";

export const Route = createFileRoute("/fact-find")({
  validateSearch: z.object({ token: z.string().optional() }),
  component: FactFindPortalPage,
});

const STATE_MESSAGES: Record<string, { title: string; body: string }> = {
  invalid: {
    title: "Link not valid",
    body: "This link is invalid or has been withdrawn. Please contact your adviser.",
  },
  expired: {
    title: "Link expired",
    body: "This link has expired. Please ask your adviser to send a new one.",
  },
  locked: {
    title: "Link locked",
    body: "Too many incorrect attempts. Please contact your adviser for a new link.",
  },
  closed: {
    title: "Already completed",
    body: "This fact find has already been processed. Thank you.",
  },
};

type OpenedState = {
  dateOfBirth: string;
  clientName: string;
  sections: { key: string; label: string }[];
  initialData: Record<string, unknown>;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <h1 className="font-serif text-2xl font-light tracking-tight mb-6">
          Fact Find
        </h1>
        {children}
      </div>
    </div>
  );
}

function FactFindPortalPage() {
  const { token } = Route.useSearch();
  const [opened, setOpened] = useState<OpenedState | null>(null);

  const { data: check, isLoading } = useQuery({
    queryKey: ["ff-token", token],
    queryFn: () => checkFactFindToken({ data: { token: token! } }),
    enabled: !!token,
    retry: false,
  });

  if (!token) {
    return (
      <Shell>
        <Message {...STATE_MESSAGES.invalid} />
      </Shell>
    );
  }
  if (isLoading || !check) {
    return (
      <Shell>
        <div className="py-10">
          <LoadingSpinner />
        </div>
      </Shell>
    );
  }
  if (check.state !== "ok") {
    return (
      <Shell>
        <Message {...STATE_MESSAGES[check.state]} />
      </Shell>
    );
  }

  return (
    <Shell>
      {opened ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {check.orgName} has asked you to confirm the details below.
          </p>
          <ClientFactFindForm
            token={token}
            dateOfBirth={opened.dateOfBirth}
            clientName={opened.clientName}
            sections={opened.sections}
            initialData={opened.initialData}
          />
        </>
      ) : (
        <DobGate
          token={token}
          orgName={check.orgName}
          onOpen={(s) => setOpened(s)}
        />
      )}
    </Shell>
  );
}

function DobGate({
  token,
  orgName,
  onOpen,
}: {
  token: string;
  orgName: string;
  onOpen: (s: OpenedState) => void;
}) {
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!dob) {
      toast.error("Please enter your date of birth");
      return;
    }
    setLoading(true);
    try {
      const result = await openFactFind({
        data: { token, dateOfBirth: dob },
      });
      onOpen({
        dateOfBirth: dob,
        clientName: result.clientName,
        sections: result.sections,
        initialData: result.data,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not verify");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 text-primary" />
        Secure access from {orgName}
      </div>
      <h2 className="heading-secondary mb-1">Confirm your identity</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Enter your date of birth to open your fact find.
      </p>
      <Label className="mb-1.5 block text-xs text-muted-foreground">
        Date of Birth
      </Label>
      <Input
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && verify()}
      />
      <Button className="mt-5 w-full" onClick={verify} disabled={loading}>
        {loading ? "Verifying…" : "Continue"}
      </Button>
    </Card>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <h2 className="heading-secondary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}
