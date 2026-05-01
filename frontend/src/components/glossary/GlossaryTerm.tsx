import { ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { lookupTerm } from "@/data/glossary";

interface Props {
  /** Glossary key, e.g. "p/e", "rsi", "market cap". */
  termKey: string;
  children: ReactNode;
}

/**
 * Wraps any text/inline content with a dotted underline + hover-card definition.
 * Falls back to plain children if the term isn't in the glossary.
 */
const GlossaryTerm = ({ termKey, children }: Props) => {
  const def = lookupTerm(termKey);
  if (!def) return <>{children}</>;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span className="cursor-help underline decoration-dotted decoration-primary/60 underline-offset-4 hover:decoration-primary">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{def.term}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{def.long}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default GlossaryTerm;
