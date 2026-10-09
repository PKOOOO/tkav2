import type { ComponentType } from 'react'
import Framer1 from './404-section-1'
import Framer2 from './404-section-2'
import Framer3 from './about-section-1'
import Framer4 from './about-section-2'
import Framer5 from './about-section-3'
import Framer6 from './about-section-4'
import Framer7 from './about-section-5'
import Framer8 from './about-section-6'
import Framer9 from './about-section-7'
import Framer10 from './about-section-8'
import Framer11 from './blog-detail-section-1'
import Framer12 from './blog-detail-section-2'
import Framer13 from './blog-detail-section-3'
import Framer14 from './blog-section-1'
import Framer15 from './blog-section-2'
import Framer16 from './blog-section-3'
import Framer17 from './contact-section-1'
import Framer18 from './contact-section-2'
import Framer19 from './contact-section-3'
import Framer20 from './contact-section-4'
import Framer21 from './contact-section-5'
import Framer22 from './cta'
import Framer23 from './footer'
import Framer24 from './gallery-section-1'
import Framer25 from './gallery-section-2'
import Framer26 from './gallery-section-3'
import Framer27 from './get-template-button'
import Framer28 from './header'
import Framer29 from './home-section-1'
import Framer30 from './home-section-10'
import Framer31 from './home-section-11'
import Framer32 from './home-section-12'
import Framer33 from './home-section-13'
import Framer34 from './home-section-14'
import Framer35 from './home-section-15'
import Framer36 from './home-section-2'
import Framer37 from './home-section-3'
import Framer38 from './home-section-4'
import Framer39 from './home-section-5'
import Framer40 from './home-section-6'
import Framer41 from './home-section-7'
import Framer42 from './home-section-8'
import Framer43 from './home-section-9'
import Framer44 from './legal-section-1'
import Framer45 from './legal-section-2'
import Framer46 from './legal-section-3'
import Framer47 from './program-detail-section-1'
import Framer48 from './program-detail-section-2'
import Framer49 from './program-detail-section-3'
import Framer50 from './programs-section-1'
import Framer51 from './programs-section-2'
import Framer52 from './programs-section-3'
import Framer53 from './teacher-section-1'
import Framer54 from './teacher-section-2'
import Framer55 from './teacher-section-3'
import Framer56 from './top-bar'

type FramerExport = { Responsive: ComponentType<Record<string, unknown>> }

// Explicit imports replace Vite's import.meta.glob and keep every exported block available.
const blocks = {
  '404-section-1': Framer1,
  '404-section-2': Framer2,
  'about-section-1': Framer3,
  'about-section-2': Framer4,
  'about-section-3': Framer5,
  'about-section-4': Framer6,
  'about-section-5': Framer7,
  'about-section-6': Framer8,
  'about-section-7': Framer9,
  'about-section-8': Framer10,
  'blog-detail-section-1': Framer11,
  'blog-detail-section-2': Framer12,
  'blog-detail-section-3': Framer13,
  'blog-section-1': Framer14,
  'blog-section-2': Framer15,
  'blog-section-3': Framer16,
  'contact-section-1': Framer17,
  'contact-section-2': Framer18,
  'contact-section-3': Framer19,
  'contact-section-4': Framer20,
  'contact-section-5': Framer21,
  'cta': Framer22,
  'footer': Framer23,
  'gallery-section-1': Framer24,
  'gallery-section-2': Framer25,
  'gallery-section-3': Framer26,
  'get-template-button': Framer27,
  'header': Framer28,
  'home-section-1': Framer29,
  'home-section-10': Framer30,
  'home-section-11': Framer31,
  'home-section-12': Framer32,
  'home-section-13': Framer33,
  'home-section-14': Framer34,
  'home-section-15': Framer35,
  'home-section-2': Framer36,
  'home-section-3': Framer37,
  'home-section-4': Framer38,
  'home-section-5': Framer39,
  'home-section-6': Framer40,
  'home-section-7': Framer41,
  'home-section-8': Framer42,
  'home-section-9': Framer43,
  'legal-section-1': Framer44,
  'legal-section-2': Framer45,
  'legal-section-3': Framer46,
  'program-detail-section-1': Framer47,
  'program-detail-section-2': Framer48,
  'program-detail-section-3': Framer49,
  'programs-section-1': Framer50,
  'programs-section-2': Framer51,
  'programs-section-3': Framer52,
  'teacher-section-1': Framer53,
  'teacher-section-2': Framer54,
  'teacher-section-3': Framer55,
  'top-bar': Framer56,
} as const

export const framerModules = blocks as unknown as Record<string, FramerExport>
