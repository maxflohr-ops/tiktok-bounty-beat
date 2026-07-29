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
