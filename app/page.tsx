'use client'

import React from 'react'
import {
  ThemeProvider,
  Navigation,
  Hero,
  Timeline,
  ProjectGrid,
  About,
  Contact
} from '@/components'

const Portfolio: React.FC = () => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Navigation handleScroll={handleScroll} />
      <Hero handleScroll={handleScroll} />
      <Timeline />
      <ProjectGrid />
      <About />
      <Contact />
    </div>
  )
}

export default function Home() {
  return (
    <ThemeProvider>
      <Portfolio />
    </ThemeProvider>
  )
}