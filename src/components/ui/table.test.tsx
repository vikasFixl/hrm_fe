import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./table";

describe("DataTable", () => {
  it("shows an empty state across all columns", () => {
    render(<DataTable columns={["Name", "Status"]} empty />);

    expect(screen.getByText("No records found")).toBeInTheDocument();
    expect(screen.getByText("No records found").closest("td")).toHaveAttribute("colspan", "2");
  });

  it("renders provided rows", () => {
    render(
      <DataTable columns={["Name"]}>
        <tr>
          <td>Engineering</td>
        </tr>
      </DataTable>
    );

    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });
});
