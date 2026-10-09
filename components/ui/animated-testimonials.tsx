"use client";

/* eslint-disable @next/next/no-img-element -- the installed demo accepts arbitrary remote photos as well as local cut-outs. */

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

type Props = {
  testimonials: Testimonial[];
  autoplay?: boolean;
  className?: string;
  /** Use the grey portrait panel for the local, transparent team cut-outs. */
  portraitStyle?: "photo" | "team";
  /** Program-specific content positioned directly after the active mentor bio. */
  details?: ReactNode;
};

export function AnimatedTestimonials({
  testimonials,
  autoplay = false,
  className,
  portraitStyle = "photo",
  details,
}: Props) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const count = testimonials.length;

  useEffect(() => {
    if (!autoplay || count < 2 || reduceMotion) return;
    const timer = window.setInterval(() => {
      setActive((previous) => (previous + 1) % count);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [autoplay, count, reduceMotion]);

  if (count === 0) return null;

  const current = testimonials[active % count];
  const team = portraitStyle === "team";

  const controls = (className: string) => count > 1 && (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={() => setActive((previous) => (previous - 1 + count) % count)}
        aria-label="Previous mentor"
        className="group flex h-10 w-10 items-center justify-center rounded-full bg-[#e6d6f0] text-[#002b5b] transition-colors hover:bg-[#d6bcea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6a1383]"
      >
        <IconArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
      </button>
      <button
        type="button"
        onClick={() => setActive((previous) => (previous + 1) % count)}
        aria-label="Next mentor"
        className="group flex h-10 w-10 items-center justify-center rounded-full bg-[#e6d6f0] text-[#002b5b] transition-colors hover:bg-[#d6bcea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6a1383]"
      >
        <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </button>
      <span className="ml-2 text-sm tabular-nums text-[#41597a]" aria-label={"Mentor " + (active % count + 1) + " of " + count}>
        {String(active % count + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </span>
    </div>
  );

  return (
    <div
      className={cn(
        "mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12",
        team && "max-w-none px-0 py-0 md:max-w-none md:px-0 lg:px-0",
        className,
      )}
    >
      <div className={cn(
        "relative grid grid-cols-1 gap-20 md:grid-cols-2",
        team && "gap-10 md:gap-12 lg:gap-24",
      )}>
        <div className="min-w-0">
          <div className={cn("relative h-80 w-full", team && "mx-auto aspect-square h-auto w-[min(100%,300px)] sm:w-[min(100%,360px)] md:mx-0 md:aspect-auto md:h-[440px] md:w-full lg:h-[520px]")}>
            <AnimatePresence initial={false}>
              {testimonials.map((testimonial, index) => {
                const selected = index === active % count;
                const restingRotation = ((index * 7) % 17) - 8;
                return (
                  <motion.div
                    key={testimonial.name + testimonial.src}
                    initial={false}
                    animate={{
                      opacity: selected ? 1 : 0.72,
                      scale: selected ? 1 : 0.94,
                      rotate: reduceMotion || selected ? 0 : restingRotation,
                      zIndex: selected ? count + 1 : count - index,
                      y: reduceMotion ? 0 : selected ? [0, -18, 0] : 0,
                    }}
                    transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeInOut" }}
                                        aria-hidden={!selected}
                    className={cn(
                      "absolute inset-0 origin-bottom overflow-hidden rounded-3xl",
                      team && "rounded-[32px] bg-[linear-gradient(120deg,#858786,#999a9c)]",
                    )}
                  >
                    <img
                      src={testimonial.src}
                      alt={selected ? testimonial.name : ""}
                      width={820}
                      height={820}
                      draggable={false}
                                            className={cn(
                        "h-full w-full object-cover object-center",
                        team && "object-contain object-bottom",
                      )}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className={cn("flex min-w-0 flex-col justify-between py-4", team && "py-1 md:py-5")}>
          <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.name}
              initial={reduceMotion ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: -20, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
              aria-live="polite"
            >
              <h3 className={cn(
                "text-2xl font-bold text-black",
                team && "font-['Bricolage_Grotesque'] text-4xl leading-[1.08] font-medium tracking-[-0.04em] text-[#002b5b] sm:text-6xl",
              )}>
                {current.name}
              </h3>
              <p className={cn(
                "mt-2 text-sm text-gray-500",
                team && "font-['Instrument_Sans'] text-base text-[#41597a]",
              )}>
                {current.designation}
              </p>
              {team && controls("mt-5 md:hidden")}
              <p className={cn(
                "mt-8 text-lg text-gray-500",
                team && "font-['Instrument_Sans'] text-base leading-7 text-[#41597a]",
              )}>
                {reduceMotion
                  ? current.quote
                  : current.quote.split(" ").map((word, index) => (
                      <motion.span
                        key={current.name + index}
                        initial={{ filter: "blur(6px)", opacity: 0, y: 4 }}
                        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.45) }}
                        className="inline-block"
                      >
                        {word}&nbsp;
                      </motion.span>
                    ))}
              </p>
            </motion.div>
          </AnimatePresence>
          {details}
          </div>

          {controls(team ? "mt-10 hidden md:flex" : "mt-10")}
        </div>
      </div>
    </div>
  );
}
