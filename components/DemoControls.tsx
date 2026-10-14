"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { resetDemo, useApp } from "@/lib/store";

/** Presenter-only panel for steering the simulated participants during a demo. */
export default function DemoControls() {
  const { state, now, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const reqId = usePathname().match(/^\/req\/([^/]+)/)?.[1];
  const current = state.requests.find((r) => r.id === reqId);

  return (
    <div className="fixed bottom-4 right-4 z-30 text-sm">
      {open && (
        <div className="mb-2 w-64 space-y-3 rounded-2xl border border-stone-300 bg-white p-4 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Demo controls</p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.demo.botsPaused}
              onChange={(e) => dispatch({ type: "SET_DEMO", patch: { botsPaused: e.target.checked } })}
            />
            Pause bots joining
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.demo.botWontAccept}
              onChange={(e) => dispatch({ type: "SET_DEMO", patch: { botWontAccept: e.target.checked } })}
            />
            A bot won&apos;t accept
          </label>
          <button
            className="w-full rounded-lg border border-stone-300 px-3 py-2 disabled:opacity-40"
            disabled={current?.status !== "open"}
            onClick={() => current && dispatch({ type: "SET_EXPIRY", requestId: current.id, expiresAt: now + 5_000 })}
          >
            Expire this request in 5s
          </button>
          <button className="w-full rounded-lg border border-red-300 px-3 py-2 text-red-700" onClick={() => resetDemo(dispatch)}>
            Reset demo
          </button>
        </div>
      )}
      <button
        className="ml-auto block rounded-full bg-stone-900 px-4 py-2 font-semibold text-white shadow-lg"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close" : "Demo"}
      </button>
    </div>
  );
}
