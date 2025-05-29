'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-blue-600" />
      )}
    </button>
  )
}