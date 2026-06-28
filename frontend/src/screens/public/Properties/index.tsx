import { motion }          from "framer-motion";
import Header              from "@/components/common/Header";
import Footer              from "@/components/common/Footer";
import PropertyFilters     from "./PropertyFilters";
import PropertyGrid        from "./PropertyGrid";
import { useProperties }   from "./hooks/useProperties";

export default function Properties() {
  const {
    properties, allCount, isLoading,
    search,     setSearch,
    typeFilter, setTypeFilter,
  } = useProperties();

  const handleClear = () => { setSearch(""); setTypeFilter(""); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      <main className="flex-1">
        <div className="mx-auto px-6 lg:px-8 py-12" style={{ maxWidth: "1280px" }}>
          <div className="flex flex-col gap-2 mb-10">
            <h1 className="text-3xl bold"
                style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
              Browse Properties
            </h1>
            <p className="text-sm" style={{ color: "var(--color-light-steel)" }}>
              {allCount} propert{allCount === 1 ? "y" : "ies"} available
            </p>
          </div>

          <PropertyFilters
            search={search}         onSearch={setSearch}
            typeFilter={typeFilter} onTypeFilter={setTypeFilter}
          />

          <PropertyGrid
            properties={properties}
            isLoading={isLoading}
            search={search}
            typeFilter={typeFilter}
            onClear={handleClear}
          />
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}