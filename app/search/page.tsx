import { Suspense } from "react";
import SearchResults from "./SearchResults";
import Header from "@/components/Header";

export default function SearchPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <Header />
      <Suspense fallback={
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)" }}>SEARCHING...</div>
        </main>
      }>
        <SearchResults />
      </Suspense>
    </div>
  );
}
