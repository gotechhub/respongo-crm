"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus, type ProjectStatus } from "../actions";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_CLASS } from "../status-labels";

export function ProjectStatusControl({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleChange(next: ProjectStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, next);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as ProjectStatus)}
        className={
          "rounded-full border-none px-[10px] py-1 text-[11px] font-bold outline-none disabled:opacity-60 " +
          PROJECT_STATUS_CLASS[status]
        }
      >
        {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
          <option key={s} value={s}>
            {PROJECT_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {error && <span className="text-[11.5px] text-destructive">{error}</span>}
    </div>
  );
}
