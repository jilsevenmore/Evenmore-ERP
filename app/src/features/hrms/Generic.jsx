import { useAppStore } from "../../stores/appStore";
export function Generic({ title, subtitle, children }) {
  const showToast = useAppStore((s) => s.showToast);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">{title}</h1><p className="text-[13px] text-muted">{subtitle}</p></div><button onClick={() => showToast(title + " action")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add New</button></div>
      {children}
    </div>;
}
