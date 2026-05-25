"use client";
import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteMedication, toggleActive } from "./actions";

export function ManageRowActions({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Link
        href={`/manage/${id}`}
        className="inline-flex h-9 items-center rounded-xl border border-line bg-white px-3 text-sm font-medium hover:bg-gray-50"
      >
        Edit
      </Link>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(() => toggleActive(id, !active).then(() => {}))}
      >
        {active ? "Deactivate" : "Activate"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this medication permanently? Past administration records remain."))
            return;
          startTransition(() => deleteMedication(id).then(() => {}));
        }}
      >
        Delete
      </Button>
    </div>
  );
}
