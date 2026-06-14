import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CountUp({
  value,
  duration = 1200,
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = window.setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        window.clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => window.clearInterval(timer);
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
