interface Props {
  results: { email: string; ok: boolean }[];
}

export default function InviteResultsList({ results }: Props) {
  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {results.map((r) => (
        <p key={r.email} className={r.ok ? "text-green-700" : "text-red-600"}>
          {r.email}: {r.ok ? "invited" : "failed"}
        </p>
      ))}
    </div>
  );
}