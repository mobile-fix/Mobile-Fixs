"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";

import { LogoMarquee } from "./LogoMarquee";

/**
 * The primary CTA both navigates and animates. Wrapping `next/link` keeps
 * client-side routing, prefetching and real anchor semantics (keyboard,
 * middle-click, "open in new tab") that a button with an onClick would destroy.
 */
const MotionLink = motion.create(Link);

/**
 * Landing hero: rounded card, full-bleed video background, floating navbar,
 * and a brand marquee beneath.
 *
 * The video is decorative only — every word in the hero is real text in the DOM,
 * so the headline is selectable, translatable, crawlable and readable with the
 * video blocked or still buffering. Nothing meaningful lives inside the frame.
 */
export function LandingHero() {
  return (
    <div className="px-4 pt-6 sm:px-6 lg:pt-8">
      <section className="relative w-full max-w-[1400px] mx-auto rounded-[48px] bg-white border border-slate-200/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden h-[600px] flex flex-col">
        {/* Video layer */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            // Decorative background: hidden from assistive tech, and never a
            // reason for the page to wait.
            aria-hidden="true"
            tabIndex={-1}
            preload="metadata"
            disablePictureInPicture
            className="w-full h-full object-cover object-[22%_center] md:object-center scale-105 transition-transform duration-1000"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260505_101331_74f9b798-3f00-4e86-8a01-377aa16ffeaa.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        {/* Copy */}
        <div className="relative z-20 flex-1 px-8 md:px-16 pt-12 md:pt-16 flex flex-col items-start">
          {/* A motion component as the brief specifies, but the entrance runs
              from the CSS `.hero-enter` keyframes: `initial={false}` keeps the
              server and client markup identical, so the copy is never shipped
              at opacity 0 and never depends on JS to appear. Motion still drives
              the interactive states below. */}
          <motion.div initial={false} className="hero-enter max-w-2xl">
            <h1 className="font-display text-[32px] sm:text-[42px] md:text-[56px] font-medium tracking-tight leading-[1.08] text-[#0a1b33]">
              Repairing the devices
              <br />
              that run your life
            </h1>

            {/* Held to the left third: the spec calls for no overlay on the
                video, so legibility comes from keeping copy over the calm side
                of the frame rather than from dimming it. */}
            <p className="font-sans mt-5 max-w-[26rem] text-[14px] md:text-[15px] leading-relaxed text-[#64748b]">
              Screen, battery, charging port and water damage repairs by certified technicians — in
              our store, at your door, or picked up and delivered. Transparent pricing up front and a
              warranty on every job.
            </p>

            <MotionLink
              href="/book"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="mt-8 inline-flex items-center gap-2 bg-[#0a152d] text-white rounded-full px-7 py-3.5 text-[13px] font-semibold shadow-lg shadow-slate-900/10 hover:bg-[#12203f] transition-colors"
            >
              Book a Repair
              <ChevronRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </MotionLink>
          </motion.div>
        </div>

        {/* Floating navbar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
          <motion.nav
            aria-label="Hero"
            initial={false}
            // `whitespace-nowrap` keeps the pill a single row: without it the
            // items wrap at narrow widths and the bar doubles in height.
            className="hero-enter-delayed flex items-center whitespace-nowrap bg-white/90 backdrop-blur-2xl px-1.5 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-200/40"
          >
            <span
              aria-hidden="true"
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm text-[#0a1b33] text-[13px]"
            >
              ✦
            </span>

            <Link
              href="/services"
              className="px-3 sm:px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors rounded-full"
            >
              Services
            </Link>
            <Link
              href="/pricing"
              className="px-3 sm:px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors rounded-full"
            >
              Pricing
            </Link>

            <Link
              href="/contact"
              className="ml-1 inline-flex items-center gap-1 bg-white px-4 sm:px-5 py-2 rounded-full text-[12px] font-semibold text-[#0a1b33] border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all"
            >
              Get in touch
              <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </motion.nav>
        </div>
      </section>

      <div className="mt-10">
        <LogoMarquee />
      </div>
    </div>
  );
}
