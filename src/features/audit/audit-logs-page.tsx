import { auditApi } from "../../api/hrm-api";
import { SimpleModulePage } from "../admin/simple-module-page";

async function readSummaryAsRows() {
  const summary = await auditApi.summary();
  if (Array.isArray(summary)) return summary;
  return Object.entries(summary || {}).map(([name, value]) => ({ name, value }));
}

export function AuditLogsPage() {
  return (
    <SimpleModulePage
      title="Audit Logs"
      description="Review HRM audit activity and export audit records."
      feature="audit"
      onExport={auditApi.export}
      tabs={[
        { value: "logs", label: "Logs", queryKey: ["audit-logs"], queryFn: auditApi.list },
        { value: "summary", label: "Summary", queryKey: ["audit-logs", "summary"], queryFn: readSummaryAsRows }
      ]}
    />
  );
}

