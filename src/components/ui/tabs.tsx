import clsx from "clsx";

export function Tabs<T extends string>({
  value,
  tabs,
  onChange
}: {
  value: T;
  tabs: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={clsx("tab", value === tab.value && "tab-active")}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
