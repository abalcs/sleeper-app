// Field Background with stadium glow and yard line pattern
export function FieldBackground({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {/* Stadium glow effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-field/5 rounded-full blur-3xl" />
      </div>
      {/* Yard line pattern overlay (subtle) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 49px,
            rgba(255, 255, 255, 0.5) 49px,
            rgba(255, 255, 255, 0.5) 50px
          )`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Endzone stripe accent for cards
export function EndzoneStripe({ color = "red", children, className = "" }) {
  const stripeClass = color === "blue" ? "endzone-stripe-blue" : "endzone-stripe-red";
  return (
    <div className={`${stripeClass} ${className}`}>
      {children}
    </div>
  );
}

// Yard line divider for section separation
export function YardLineDivider({ label, className = "" }) {
  return (
    <div className={`yard-line my-6 ${className}`}>
      {label && <span>{label}</span>}
    </div>
  );
}

// Field texture overlay for cards
export function FieldOverlay({ className = "" }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none rounded-xl ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(45, 90, 61, 0.03) 0%, transparent 50%)`,
      }}
    />
  );
}

export default FieldBackground;
