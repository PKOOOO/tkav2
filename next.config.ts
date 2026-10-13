import type { NextConfig } from "next";

/**
 * URLs the site this replaces has in Google's index, mapped onto routes that
 * exist here. The live sitemap at techkidzafrica.co.ke/sitemap.xml lists 17
 * URLs; `/`, `/about` and `/contact` keep their paths, and everything below is
 * the remainder. Losing them is how a redesign loses its search ranking, so
 * each indexed path is listed explicitly rather than swept up by a catch-all.
 *
 * `statusCode` rather than Next's `permanent` flag, because the distinction
 * carries weight here: `permanent: true` sends 308, which asks clients to cache
 * the redirect *forever*. For a section that is genuinely gone that is what we
 * want (301 is the same signal to Google and is understood by more of the long
 * tail of crawlers). For `/careers` it would be actively wrong -- that section
 * is coming back, and a browser holding a permanent redirect would keep
 * bypassing it. Hence 302 there and 301 everywhere else.
 */
const RETIRED_SECTIONS = [
    /**
     * The programme listing. `/programs` is the ranked URL on the live site,
     * but Framer's export declares `/program` in its generated routes table and
     * every Framer-internal link points there, so `/program` is canonical here
     * and the indexed URL takes one hop. Nothing is indexed below `/programs`
     * -- the live sitemap has no programme children, because its Sanity query
     * returns no programme documents with slugs -- so the children only catch
     * strays and all land on the listing.
     */
    { source: "/programs", destination: "/program", statusCode: 301 },
    { source: "/programs/:slug*", destination: "/program", statusCode: 301 },

    /**
     * Framer's original CMS slugs for the four template courses. The CMS cell
     * still says `mathematics` while everything rendered on the page says
     * "Animation & Gamification" -- renaming the slug means editing the Framer
     * CMS -- so `programRouteSlugs` maps each to its real URL and
     * `programHref` resolves every internal link through it.
     *
     * The pages used to be built at both paths. Nothing pointed at the alias:
     * `ProgramListing` and `HomeProgramCards` both go through `programHref`,
     * and the live site has no indexed programme children to preserve. So the
     * alias was a second indexable copy of a real course -- `index, follow`,
     * defended by nothing but a canonical -- and these replace it.
     *
     * Keep this in step with `programRouteSlugs` in `lib/cms.ts`; it is the
     * same four pairs, and the redirect is now the only thing serving them.
     */
    { source: "/program/mathematics", destination: "/program/animation-and-gamification", statusCode: 301 },
    { source: "/program/science", destination: "/program/robotics-and-tinkering", statusCode: 301 },
    { source: "/program/english", destination: "/program/digital-literacy-skills", statusCode: 301 },
    { source: "/program/coding", destination: "/program/software-engineering", statusCode: 301 },

    /**
     * `/projects` showcased delivered work (aclp, ccif, cif,
     * compassion-innovation-stars, experience-ai -- all five were indexed).
     * `/gallery` is the closest thing here: the same "what we have actually
     * done" intent, where `/about` would answer a different question.
     */
    { source: "/projects", destination: "/gallery", statusCode: 301 },
    { source: "/projects/:slug*", destination: "/gallery", statusCode: 301 },

    // Past activities, for the same reason.
    { source: "/events", destination: "/gallery", statusCode: 301 },

    // Mission and outcomes narrative -- that now lives on /about.
    { source: "/impact", destination: "/about", statusCode: 301 },

    /**
     * 302, not 301: careers is coming back. Four postings were indexed
     * (communication-intern, industrial-attachment-stem,
     * learning-facilitator-intern,
     * monitoring-and-evaluation-m-and-e-intern-6-months). Both rules point
     * straight at /about rather than chaining the children through /careers.
     *
     * When the section returns, delete these two lines -- nothing else needs
     * to change.
     */
    { source: "/careers", destination: "/about", statusCode: 302 },
    { source: "/careers/:slug*", destination: "/about", statusCode: 302 },
];

/**
 * Carried over verbatim in intent from the deployed site's own
 * `next.config.ts`, which maps a pre-Next PHP site onto the current one. That
 * migration was already done once; replacing the repo without these would
 * break every one of those links a second time.
 *
 * Retargeted where the old destination no longer exists: `/programs` ->
 * `/program` and `/events` -> `/gallery` per the table above. The news and blog
 * URLs are an improvement rather than a copy -- the old table sent them to `/`,
 * and this site has a real `/blogs` listing to send them to instead.
 *
 * **Order matters.** `/public/index.php/:path*` is a catch-all that swallows
 * its more specific siblings, and Next matches in array order, so it stays
 * below them exactly as it does in the original.
 */
const LEGACY_PHP_PATHS = [
    { source: "/team_page", destination: "/", statusCode: 301 },
    { source: "/Enrolment_page", destination: "/program", statusCode: 301 },
    { source: "/about.php", destination: "/about", statusCode: 301 },
    { source: "/contact.php", destination: "/contact", statusCode: 301 },
    { source: "/programs.php", destination: "/program", statusCode: 301 },
    { source: "/all_events_view", destination: "/gallery", statusCode: 301 },
    { source: "/Faq", destination: "/about", statusCode: 301 },
    { source: "/all_blogs", destination: "/blogs", statusCode: 301 },
    { source: "/contactus_page", destination: "/contact", statusCode: 301 },
    { source: "/programs_page", destination: "/program", statusCode: 301 },
    { source: "/faq_page", destination: "/about", statusCode: 301 },
    { source: "/public/about_main_page", destination: "/about", statusCode: 301 },
    { source: "/home", destination: "/", statusCode: 301 },
    { source: "/about_main_page", destination: "/about", statusCode: 301 },
    { source: "/about-tech-kidz-africa", destination: "/about", statusCode: 301 },
    { source: "/index.html", destination: "/", statusCode: 301 },
    { source: "/news_page", destination: "/blogs", statusCode: 301 },
    { source: "/show_all_news", destination: "/blogs", statusCode: 301 },
    { source: "/main_news_view/:id", destination: "/blogs", statusCode: 301 },
    { source: "/post_details/:id", destination: "/blogs", statusCode: 301 },
    { source: "/single_program/:id", destination: "/program", statusCode: 301 },
    { source: "/single_event/:id", destination: "/gallery", statusCode: 301 },
    { source: "/view_program", destination: "/program", statusCode: 301 },
    { source: "/donate", destination: "/", statusCode: 301 },
    { source: "/public/index.php/main_news_view/:id", destination: "/blogs", statusCode: 301 },
    { source: "/public/index.php/single_event/:id", destination: "/gallery", statusCode: 301 },
    { source: "/public/index.php/single_program/:id", destination: "/program", statusCode: 301 },
    { source: "/public/index.php/show_all_news", destination: "/blogs", statusCode: 301 },
    { source: "/public/index.php/Enrolment_page", destination: "/program", statusCode: 301 },
    { source: "/public/index.php/all_blogs", destination: "/blogs", statusCode: 301 },
    { source: "/public/index.php/:path*", destination: "/", statusCode: 301 },
    { source: "/public/post_details/:id", destination: "/blogs", statusCode: 301 },
    { source: "/public/faq_page", destination: "/about", statusCode: 301 },
    { source: "/public/all_events_view", destination: "/gallery", statusCode: 301 },
    { source: "/public/programs_page", destination: "/program", statusCode: 301 },
    { source: "/index.php", destination: "/", statusCode: 301 },

    // Staff webmail. Not SEO -- a live shortcut people type, pointing off-site
    // at the mail host, so it has to survive the move.
    { source: "/webmail", destination: "https://mail.techkidzafrica.co.ke:2096", statusCode: 301 },
];

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

  // Must live inside this object. A bare `module.exports = { ... }` here would
  // replace the whole exports object and silently discard everything above --
  // including `reactStrictMode: false`, which is how the appear effects broke.
  allowedDevOrigins: ['192.168.0.136', '192.168.1.196' ,'172.20.10.3', '192.168.1.97'],

  async redirects() {
    return [...RETIRED_SECTIONS, ...LEGACY_PHP_PATHS];
  },
};

export default nextConfig;
