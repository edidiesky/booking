import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

/**
 * Slim search. Only sends parameters /search actually filters on (q,
 * propertyType, guests). Dates are not collected here because the search API
 * ignores them today; asking for input that gets dropped is a broken promise.
 */
export default function HeroSearch() {
  const id = useId();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [guests, setGuests] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("propertyType", type);
    if (guests) params.set("guests", guests);
    navigate(`/search${params.toString() ? `?${params}` : ""}`);
  };

  const cell = "flex min-w-0 flex-col justify-center gap-0.5 rounded-[18px] px-4 py-2.5 transition-colors duration-150 hover:bg-black/[0.03] focus-within:bg-black/[0.03]";
  const label = "text-[0.75rem] font-[600] text-[var(--mk-ink)]";
  const control = "w-full bg-transparent text-[0.9375rem] text-[var(--mk-ink)] outline-none placeholder:text-[var(--mk-faint)]";

  return (
    <form
      role="search"
      onSubmit={submit}
      className="grid w-full max-w-[44rem] grid-cols-1 gap-1 rounded-[26px] bg-[var(--mk-surface)] p-2 shadow-[var(--mk-shadow-float)] sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]"
    >
      <div className={cell}>
        <label htmlFor={`${id}-q`} className={label}>
          Where
        </label>
        <input
          id={`${id}-q`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Lekki, Ikoyi, Wuse 2"
          className={control}
          autoComplete="off"
        />
      </div>
      <div className={cell}>
        <label htmlFor={`${id}-type`} className={label}>
          Type
        </label>
        <select id={`${id}-type`} value={type} onChange={(e) => setType(e.target.value)} className={control}>
          <option value="">Any stay</option>
          <option value="shortlet">Shortlet</option>
          <option value="hotel">Hotel</option>
          <option value="guesthouse">Guesthouse</option>
        </select>
      </div>
      <div className={cell}>
        <label htmlFor={`${id}-guests`} className={label}>
          Guests
        </label>
        <select id={`${id}-guests`} value={guests} onChange={(e) => setGuests(e.target.value)} className={control}>
          <option value="">Any</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </div>
      {/* Concentric: form radius 26 = button radius 18 + padding 8. */}
      <button type="submit" className="mk-btn mk-btn-primary h-auto min-h-12 rounded-[18px] ps-5 pe-[1.125rem]">
        <span>Search</span>
        <Search size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  );
}
