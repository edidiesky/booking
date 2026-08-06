export default function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full px-6 py-5 border-b border-[#e8e6e3] flex flex-col gap-4">
      <p className="text-xs lg:text-sm uppercase text-[#a3a6af]">{label}</p>
      {children}
    </div>
  );
}