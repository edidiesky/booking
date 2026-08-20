export default function DrawerField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-8 lg:gap-10">
      <span className="text-xs lg:text-[13px]  flex-1 text-[#777b86]">{label}</span>
      <span className="text-xs lg:text-[13px]  text-end flex-1 text-[#17191c] bold">{value}</span>
    </div>
  );
}