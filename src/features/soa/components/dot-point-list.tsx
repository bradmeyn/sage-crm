import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export default function DotPointList({
  label,
  points,
  onChange,
  accent,
}: {
  label: string;
  points: string[];
  onChange: (next: string[]) => void;
  accent: "benefit" | "warning";
}) {
  const dot = accent === "benefit" ? "bg-primary" : "bg-amber-500";
  const set = (i: number, v: string) =>
    onChange(points.map((p, idx) => (idx === i ? v : p)));
  const remove = (i: number) => onChange(points.filter((_, idx) => idx !== i));
  const add = () => onChange([...points, ""]);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="space-y-1.5">
        {points.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full shrink-0 ${dot}`} />
            <Input
              value={p}
              onChange={(e) => set(i, e.target.value)}
              className="h-8"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              onClick={() => remove(i)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={add} className="text-muted-foreground">
          <Plus className="size-4" />
          Add {accent === "benefit" ? "benefit" : "warning"}
        </Button>
      </div>
    </div>
  );
}
