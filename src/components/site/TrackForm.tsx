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
      className="glass flex min-h-14 w-full items-center gap-2 rounded-2xl p-1.5 shadow-glow sm:rounded-full"
      role="search"
      aria-label="Suivre une expédition"
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
        autoCapitalize="characters"
        enterKeyHint="search"
        maxLength={128}
        className="min-h-11 min-w-0 flex-1 rounded-xl bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent sm:rounded-full"
      />
      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="min-h-11 shrink-0"
        disabled={!query.trim()}
      >
        Suivre
      </Button>
    </form>
  );
}
