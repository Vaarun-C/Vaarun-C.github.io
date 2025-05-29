'use client'

import React from 'react'
import { Download } from 'lucide-react'

interface HeroProps {
  handleScroll: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void
}

const ResumeDownload: React.FC = () => {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/resume.pdf' // Place your resume.pdf in the public folder
    link.download = 'Varun_C_Resume.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
    >
      <Download size={20} />
      Download Resume
    </button>
  )
}

export const Hero: React.FC<HeroProps> = ({ handleScroll }) => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Hi, I'm Varun
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8">
          Cloud & Backend Enthusiast | Tech Explorer
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          A versatile developer with experience across game development, big data, cloud infrastructure, 
          web development, AI, backend systems, and networking. Passionate about cloud technologies and scalable backend solutions.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="#projects" 
            onClick={(e) => handleScroll(e, 'projects')}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
          >
            View My Work
          </a>
          <ResumeDownload />
          <a 
            href="#contact" 
            onClick={(e) => handleScroll(e, 'contact')}
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg font-semibold transition-colors"
          >
            Get In Touch
          </a>
        </div>
      </div>
    </section>
  )
}