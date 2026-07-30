import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ContentAccessManager } from "@/components/ContentAccessManager";
import { getStudentRoster } from "@/lib/admin.functions";

export const Route = createFileRoute("/liberte-profesor-panel-9382745-admin/accesos")({
  component: AccesosTab,
});

function AccesosTab() {
  const [students, setStudents] = useState<{ id: string; full_name: string | null; email: string | null }[] | null>(null);

  useEffect(() => {
    let alive = true;
    getStudentRoster()
      .then((rows) => {
        if (alive) setStudents(rows);
      })
      .catch(() => {
        if (alive) setStudents([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (students === null) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  return <ContentAccessManager students={students} />;
}
