import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Framer's appear-on-scroll effects are one-shot: the generated components
   * pass `__framer__animateOnce`, so the reveal is meant to run a single time.
   *
   * React Strict Mode (which Next enables by default) mounts every component
   * twice in development: mount -> effect -> cleanup -> mount. The cleanup puts
   * the element back to the effect's initial state (opacity 0, translateY 30px)
   * while the "already animated" flag survives, so the second mount never
   * replays it. Every section below the fold then stays invisible forever, and
   * the page looks like it only has a hero.
   *
   * The Vite version this was ported from renders without StrictMode, which is
   * why the same components animate correctly there.
   */
  reactStrictMode: false,

  
};

module.exports = {
  allowedDevOrigins: ['192.168.0.165','172.20.10.3', '192.168.1.97'],
}

export default nextConfig;
