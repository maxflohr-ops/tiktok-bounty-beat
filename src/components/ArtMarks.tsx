// Hand-drawn marks cut from the studio art sheets (public/art/*.png),
// recolored to the bs ink/accent palette on transparency. All decorative.
type MarkProps = { className?: string };

export function InkDogwood({ className = "" }: MarkProps) {
  return (
    <img
      src="/art/dogwood.png"
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

export function InkCardinal({ accent = false, className = "" }: MarkProps & { accent?: boolean }) {
  return (
    <img
      src={accent ? "/art/cardinal-accent.png" : "/art/cardinal.png"}
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

export function InkSeal({ accent = false, className = "" }: MarkProps & { accent?: boolean }) {
  return (
    <img
      src={accent ? "/art/great-seal-accent.png" : "/art/great-seal.png"}
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

export function InkDrips({ className = "" }: MarkProps) {
  return (
    <img
      src="/art/drips.png"
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

export function InkScrawl({ className = "" }: MarkProps) {
  return (
    <img
      src="/art/scrawl.png"
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

export function GuillocheRosette({ className = "" }: MarkProps) {
  return (
    <img
      src="/art/guilloche-rosette.svg"
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

export function GuillocheBand({ className = "" }: MarkProps) {
  return (
    <img
      src="/art/guilloche-band.svg"
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={`pointer-events-none h-10 w-full object-cover select-none ${className}`}
    />
  );
}

// Microprint: reads as a rule until you lean in — like the security text on a bill.
export function MicroRule({ className = "" }: MarkProps) {
  return (
    <div aria-hidden className={`microrule ${className}`}>
      {Array.from({ length: 14 })
        .map(() => "bounty sounds · verified views · funded pots · good to the bearer")
        .join(" · ")}
    </div>
  );
}
