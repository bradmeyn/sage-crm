import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Users,
  FileText,
  PieChart,
  ArrowRight,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/functions/auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session?.user) {
      throw redirect({ to: "/clients" });
    }
  },
  component: LandingPage,
});

/** Fade + rise into view when scrolled into the viewport. */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-serif text-xl font-semibold tracking-tight"
          >
            Sage
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Stylised in-product CRM screenshot used in the hero. */
function DashboardMock() {
  const clients = [
    { name: "Margaret & Paul Whitfield", tag: "Active", value: "$1.84M" },
    { name: "Acme Family Trust", tag: "Review", value: "$920K" },
    { name: "Dr. Helena Cho", tag: "Active", value: "$2.31M" },
    { name: "The Okafor Group", tag: "Onboarding", value: "$480K" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <span className="size-3 rounded-full bg-destructive/40" />
        <span className="size-3 rounded-full bg-chart-4/50" />
        <span className="size-3 rounded-full bg-chart-2/50" />
        <div className="ml-4 flex items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
          <Search className="size-3" />
          app.sage.crm/clients
        </div>
      </div>
      <div className="grid grid-cols-[180px_1fr]">
        {/* sidebar */}
        <aside className="hidden sm:flex flex-col gap-1 border-r border-border bg-sidebar p-3">
          <div className="px-2 pb-3 font-serif text-base font-semibold">
            Sage
          </div>
          {[
            { label: "Clients", active: true },
            { label: "Jobs", active: false },
            { label: "Dashboard", active: false },
            { label: "Settings", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-md px-2 py-1.5 text-sm ${
                item.active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </div>
          ))}
        </aside>
        {/* main panel */}
        <div className="p-4 sm:p-5">
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: "Clients", value: "248" },
              { label: "FUM", value: "$96M" },
              { label: "Open Jobs", value: "17" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Client</span>
              <span>Portfolio</span>
            </div>
            {clients.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between border-b border-border px-3 py-2.5 last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {c.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <div className="text-sm font-medium leading-tight">
                      {c.name}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {c.tag}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {c.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Built for financial advice practices
            </span>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              The practice management platform for modern advisers
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Sage brings your clients, advice records, and financial data into
              one place — so you spend less time on admin and more time advising.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <Reveal delay={100}>
            <DashboardMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

type Feature = {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  visual: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    eyebrow: "Clients",
    title: "Modern Client Management",
    description:
      "A single record for every client and household — contacts, partners, goals, and the full relationship history. Find anyone in seconds and pick up exactly where you left off.",
    icon: Users,
    visual: (
      <div className="space-y-3">
        {[
          { name: "Margaret & Paul Whitfield", meta: "Joint · 2 partners" },
          { name: "Dr. Helena Cho", meta: "Individual · Active" },
          { name: "The Okafor Group", meta: "Entity · Onboarding" },
        ].map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
          >
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {c.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.meta}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    eyebrow: "Compliance",
    title: "Advice Documentation",
    description:
      "Capture file notes, store documents, and keep a timestamped record of every interaction. Your compliance trail builds itself as you work — audit-ready, always.",
    icon: FileText,
    visual: (
      <div className="space-y-3">
        {[
          {
            title: "Annual review meeting",
            body: "Discussed retirement timeline and updated risk profile…",
            date: "12 Jun",
          },
          {
            title: "SOA issued",
            body: "Statement of Advice provided and acknowledged.",
            date: "04 Jun",
          },
        ].map((n) => (
          <div
            key={n.title}
            className="rounded-lg border border-border bg-background p-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.date}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {n.body}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    eyebrow: "Insights",
    title: "Financial Position at a Glance",
    description:
      "Balance sheet, cashflow, goals, and insurance for every client — kept current and surfaced when you need them. See the whole financial picture before every conversation.",
    icon: PieChart,
    visual: (
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Net Worth", value: "$1.84M", trend: "+6.2%" },
          { label: "Annual Cashflow", value: "$182K", trend: "+3.1%" },
          { label: "Goals on Track", value: "4 / 5", trend: null },
          { label: "Cover Gap", value: "$0", trend: "Closed" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-background p-3.5"
          >
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {s.value}
            </div>
            {s.trend && (
              <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <TrendingUp className="size-3" />
                {s.trend}
              </div>
            )}
          </div>
        ))}
      </div>
    ),
  },
];

function FeatureSection({
  feature,
  flipped,
}: {
  feature: Feature;
  flipped: boolean;
}) {
  const Icon = feature.icon;
  return (
    <Reveal>
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className={flipped ? "lg:order-2" : ""}>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Icon className="size-4" />
            {feature.eyebrow}
          </span>
          <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            {feature.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{feature.description}</p>
        </div>
        <div className={flipped ? "lg:order-1" : ""}>
          <div className="rounded-2xl border border-border bg-muted/30 p-5 shadow-sm">
            {feature.visual}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything your practice runs on
            </h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built for advisers — not a generic sales CRM bent into
              shape.
            </p>
          </Reveal>
          <div className="space-y-20 lg:space-y-28">
            {FEATURES.map((feature, i) => (
              <FeatureSection
                key={feature.title}
                feature={feature}
                flipped={i % 2 === 1}
              />
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30">
          <Reveal className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Bring your practice into one place
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Start managing clients, advice, and financials with Sage today.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <span className="font-serif text-base font-semibold text-foreground">
            Sage
          </span>
          <span>© {new Date().getFullYear()} Sage. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
