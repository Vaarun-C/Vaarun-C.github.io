'use client'

import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/common'

interface NavigationProps {
  handleScroll: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void
}

export const Navigation: React.FC<NavigationProps> = ({ handleScroll }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '#home', label: 'Home', id: 'home' },
    { href: '#experience', label: 'Experience', id: 'experience' },
    { href: '#projects', label: 'Projects', id: 'projects' },
    { href: '#about', label: 'About', id: 'about' },
    { href: '#contact', label: 'Contact', id: 'contact' },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    handleScroll(e, id)
    setMobileMenuOpen(false)
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    const element = document.getElementById('home')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span 
              onClick={handleLogoClick} 
              className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent cursor-pointer"
            >
              Varun C
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a 
                key={item.id}
                href={item.href} 
                onClick={(e) => handleNavClick(e, item.id)} 
                className="hover:text-green-400 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <a 
                key={item.id}
                href={item.href} 
                onClick={(e) => handleNavClick(e, item.id)} 
                className="block px-3 py-2 hover:text-green-400 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}