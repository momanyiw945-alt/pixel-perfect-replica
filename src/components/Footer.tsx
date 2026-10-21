import { Info } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card/60 px-4 py-5">
      <p className="mx-auto flex max-w-3xl items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        Unofficial study tool. Not affiliated with or endorsed by Microsoft.
      </p>
    </footer>
  );
}
