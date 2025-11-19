//generated with deepseek

import { useState, useEffect } from "react";

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<"small" | "medium" | "large">(
    "small"
  );

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 400) setBreakpoint("small");
      else if (width < 1024) setBreakpoint("medium");
      else setBreakpoint("large");
    };

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);

    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  return breakpoint;
};

export const useResponsiveBadgeSize = (): "small" | "medium" | "large" => {
  const breakpoint = useBreakpoint();

  const sizeMap = {
    small: "small",
    medium: "medium",
    large: "large",
  } as const;

  return sizeMap[breakpoint];
};
