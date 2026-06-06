import { Department, Employee, Position } from "../api/types";

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function formatTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function minutesToHours(minutes?: number) {
  if (!minutes) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function personName(employee?: Employee | string) {
  if (!employee || typeof employee === "string") return "-";
  return [employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.employeeCode;
}

export function departmentName(department?: Department | string) {
  if (!department || typeof department === "string") return "-";
  return department.name;
}

export function positionName(position?: Position | string) {
  if (!position || typeof position === "string") return "-";
  return position.title;
}
