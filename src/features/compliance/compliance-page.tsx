import { complianceApi } from "../../api/hrm-api";
import { SimpleModulePage } from "../admin/simple-module-page";

export function CompliancePage() {
  return (
    <SimpleModulePage
      title="Compliance"
      description="Create and review compliance audit records."
      feature="compliance"
      createLabel="Create Audit"
      onCreate={complianceApi.createAudit}
      tabs={[
        { value: "audits", label: "Audits", queryKey: ["compliance", "audits"], queryFn: complianceApi.audits }
      ]}
    />
  );
}

