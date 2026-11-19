import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrackForm({ initial = "" }: { initial?: string }) {
  const [query, setQuery] = useState(initial);
  const navigate = useNavigate();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate({ to: "/suivi", search: { q: value } });
  }

  return (
    <form
      onSubmit={submit}
      className="glass flex w-full items-center gap-2 rounded-full p-1.5 shadow-glow"
      role="search"
    >
      <Search className="ml-3 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <label htmlFor="shipment-tracking-code" className="sr-only">
        Code de suivi, commande, AWB, BL ou numéro de conteneur
      </label>
      <input
        id="shipment-tracking-code"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Code, commande, AWB, BL ou conteneur…"
        autoComplete="off"
        maxLength={128}
        className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
      />
      <Button type="submit" variant="hero" size="lg" disabled={!query.trim()}>
        Suivre
      </Button>
    </form>
  );
}
