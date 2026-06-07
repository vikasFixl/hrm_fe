export function formatEmployeeName(employee: any): string {
  if (!employee) return "-";
  if (employee.name?.trim()) return employee.name.trim();
  const first = employee.personalInfo?.firstName || "";
  const last = employee.personalInfo?.lastName || "";
  const full = `${first} ${last}`.trim();
  return full || employee.personalInfo?.contact?.email || employee.email || "-";
}

export function formatAmount(amount: unknown, currency = "$"): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return `${currency}0.00`;
  return `${currency}${value.toFixed(2)}`;
}
