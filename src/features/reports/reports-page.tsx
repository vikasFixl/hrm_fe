import { reportingApi } from "../../api/hrm-api";
import { SimpleModulePage } from "../admin/simple-module-page";

export function ReportsPage() {
  return (
    <SimpleModulePage
      title="Reports"
      description="Generate and review HRM reporting snapshots."
      feature="reports"
      createLabel="Generate Report"
      onCreate={reportingApi.generate}
      tabs={[
        { value: "reports", label: "Reports", queryKey: ["reports"], queryFn: reportingApi.list }
      ]}
    />
  );
}

