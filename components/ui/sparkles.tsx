"use client";

import { useId, useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";

const initParticles = (engine: Engine) => loadSlim(engine);

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

export function SparklesCore({
  id,
  className,
  background = "transparent",
  particleSize,
  minSize,
  maxSize,
  speed = 0.3,
  particleColor = "#ffffff",
  particleDensity = 80,
}: ParticlesProps) {
  const generatedId = useId();
  const options = useMemo<ISourceOptions>(
    () => ({
      background: { color: { value: background } },
      fullScreen: { enable: false },
      fpsLimit: 45,
      interactivity: { events: { onClick: { enable: false }, onHover: { enable: false } } },
      particles: {
        color: { value: particleColor },
        move: { enable: true, speed, outModes: { default: "out" } },
        number: {
          value: Math.min(particleDensity, 500),
          density: { enable: true, width: 400, height: 400 },
        },
        opacity: { value: { min: 0.1, max: 1 } },
        shape: { type: "circle" },
        size: { value: { min: minSize ?? particleSize ?? 0.4, max: maxSize ?? particleSize ?? 1 } },
      },
    }),
    [background, particleColor, particleDensity, minSize, maxSize, particleSize, speed],
  );

  return (
    <ParticlesProvider init={initParticles}>
      <Particles id={id ?? generatedId} className={cn("h-full w-full", className)} options={options} />
    </ParticlesProvider>
  );
}
