import type { RequestStatus } from "@/lib/types";

const STEPS: { status: RequestStatus; label: string }[] = [
  { status: "confirmed", label: "Order placed with the restaurant" },
  { status: "preparing", label: "Restaurant is preparing your food" },
  { status: "out_for_delivery", label: "Courier on the way" },
  { status: "delivered", label: "Delivered to the collection point" },
];

/** Step 7: simulated delivery progress. */
export default function DeliveryTimeline({ status }: { status: RequestStatus }) {
  const current = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="space-y-3">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.status} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-500"
              } ${i === current && status !== "delivered" ? "animate-pulse" : ""}`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={done ? "font-medium" : "text-stone-400"}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
