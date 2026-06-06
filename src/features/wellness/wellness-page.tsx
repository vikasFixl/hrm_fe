import { wellnessApi } from "../../api/hrm-api";
import { SimpleModulePage } from "../admin/simple-module-page";

export function WellnessPage() {
  return (
    <SimpleModulePage
      title="Wellness"
      description="Manage wellness programs and employee enrollment."
      feature="wellness"
      createLabel="Create Program"
      onCreate={wellnessApi.create}
      tabs={[
        { value: "programs", label: "Programs", queryKey: ["wellness"], queryFn: wellnessApi.list }
      ]}
    />
  );
}

