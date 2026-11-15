import React from "react";

/**
 * Editorial Luxury Bubble / Star Rating component.
 * @param {number} rating - Value between 1.0 and 5.0
 * @param {number} count - Optional review count e.g. 1420
 * @param {boolean} interactive - Allows clicking to select rating
 * @param {function} onChange - Callback with selected rating
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function RatingBubbles({
  rating = 5.0,
  count = null,
  interactive = false,
  onChange = null,
  size = "md",
}) {
  const bubbles = [1, 2, 3, 4, 5];

  const sizeMap = {
    sm: { diameter: "12px", text: "0.78rem" },
    md: { diameter: "16px", text: "0.88rem" },
    lg: { diameter: "22px", text: "1.1rem" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const handleClick = (val) => {
    if (interactive && onChange) {
      onChange(val);
    }
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
        {bubbles.map((val) => {
          const diff = rating - (val - 1);
          let bg = "#e2e8f0";
          if (diff >= 1) {
            bg = "#f59e0b";
          } else if (diff >= 0.5) {
            bg = "linear-gradient(90deg, #f59e0b 50%, #e2e8f0 50%)";
          }

          return (
            <span
              key={val}
              onClick={() => handleClick(val)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: currentSize.diameter,
                height: currentSize.diameter,
                borderRadius: "50%",
                background: bg,
                cursor: interactive ? "pointer" : "default",
                boxShadow: interactive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (interactive) e.currentTarget.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                if (interactive) e.currentTarget.style.transform = "scale(1)";
              }}
              title={`${val} rating`}
            />
          );
        })}
      </div>

      <span
        style={{
          fontSize: currentSize.text,
          fontWeight: 800,
          color: "#d97706",
        }}
      >
        {rating ? Number(rating).toFixed(1) : "5.0"}
      </span>

      {count !== null && (
        <span style={{ fontSize: currentSize.text, color: "#64748b" }}>
          ({Number(count).toLocaleString()} reviews)
        </span>
      )}
    </div>
  );
}
