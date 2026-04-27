"use client";

import { useEffect, useRef, useState } from "react";

interface ExpandableTextProps {
  text: string;
  collapsedLabel: string;
  expandedLabel: string;
  className?: string;
}

export default function ExpandableText({
  text,
  collapsedLabel,
  expandedLabel,
  className = "",
}: ExpandableTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const element = textRef.current;
      if (!element) return;

      setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [text]);

  return (
    <div>
      <p
        ref={textRef}
        className={[
          "text-base text-base-content/75 leading-relaxed",
          !isExpanded ? "line-clamp-3 md:line-clamp-4" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {text}
      </p>

      {isOverflowing && (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-primary hover:text-primary-focus transition-colors"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? expandedLabel : collapsedLabel}
        </button>
      )}
    </div>
  );
}
