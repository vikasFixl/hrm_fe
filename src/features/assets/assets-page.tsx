import { assetApi } from "../../api/hrm-api";
import { SimpleModulePage } from "../admin/simple-module-page";

export function AssetsPage() {
  return (
    <SimpleModulePage
      title="Asset Management"
      description="Track assets, assignments, returns, and employee-owned inventory."
      feature="assets"
      createLabel="Create Asset"
      onCreate={assetApi.create}
      tabs={[
        { value: "assets", label: "Assets", queryKey: ["assets"], queryFn: assetApi.list },
        { value: "assigned", label: "Assigned To Me", queryKey: ["assets", "assigned"], queryFn: assetApi.assigned }
      ]}
    />
  );
}

