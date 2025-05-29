'use client'

import React, { useState, useEffect } from 'react'
import { Github, Linkedin, Twitter, Mail, ExternalLink, Menu, X, Code, User, Send } from 'lucide-react'

interface Repo {
  id: number
  name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
}

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchGitHubRepos()
  }, [])

  const fetchGitHubRepos = async () => {
    try {
      // Fetch more repos (20) to ensure we get all good ones, then filter/sort
      const response = await fetch('https://api.github.com/users/Vaarun-C/repos?sort=updated&per_page=20')
      const data = await response.json()
      
      // Filter out forks if desired (optional)
      const ownRepos = data.filter((repo: Repo) => !repo.name.includes('fork') || repo.stargazers_count > 0 || repo.forks_count > 0)
      
      // Sort repos by stars first, then forks, then by last updated
      const sortedRepos = ownRepos.sort((a: Repo, b: Repo) => {
        if (b.stargazers_count !== a.stargazers_count) {
          return b.stargazers_count - a.stargazers_count
        }
        if (b.forks_count !== a.forks_count) {
          return b.forks_count - a.forks_count
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
      
      // Take top 6 after sorting
      setRepos(sortedRepos.slice(0, 6))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching repos:', error)
      setLoading(false)
    }
  }

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    element?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                <span 
                  onClick={(e) => handleScroll(e, 'home')} 
                  className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent cursor-pointer"
                >
                  Varun C
                </span>
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <a href="#home" onClick={(e) => handleScroll(e, 'home')} className="hover:text-green-400 transition-colors">Home</a>
              <a href="#projects" onClick={(e) => handleScroll(e, 'projects')} className="hover:text-green-400 transition-colors">Projects</a>
              <a href="#about" onClick={(e) => handleScroll(e, 'about')} className="hover:text-green-400 transition-colors">About</a>
              <a href="#contact" onClick={(e) => handleScroll(e, 'contact')} className="hover:text-green-400 transition-colors">Contact</a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-800 border-b border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#home" onClick={(e) => handleScroll(e, 'home')} className="block px-3 py-2 hover:text-green-400 transition-colors">Home</a>
              <a href="#projects" onClick={(e) => handleScroll(e, 'projects')} className="block px-3 py-2 hover:text-green-400 transition-colors">Projects</a>
              <a href="#about" onClick={(e) => handleScroll(e, 'about')} className="block px-3 py-2 hover:text-green-400 transition-colors">About</a>
              <a href="#contact" onClick={(e) => handleScroll(e, 'contact')} className="block px-3 py-2 hover:text-green-400 transition-colors">Contact</a>
            </div>
          </div>
        )}
      </nav>

      {/* Home Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Hi, I'm Varun
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-8">
            Cloud & Backend Enthusiast | Tech Explorer
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            A versatile developer with experience across game development, big data, cloud infrastructure, 
            web development, AI, backend systems, and networking. Passionate about cloud technologies and scalable backend solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#projects" 
              onClick={(e) => handleScroll(e, 'projects')}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
            >
              View My Work
            </a>
            <a 
              href="#contact" 
              onClick={(e) => handleScroll(e, 'contact')}
              className="px-8 py-3 border border-gray-600 hover:border-gray-500 rounded-lg font-semibold transition-colors"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Code className="text-green-400" />
              Projects
            </h2>
            <p className="text-gray-400">Here are some of my top projects from GitHub (sorted by stars & activity)</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => (
                <div key={repo.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700">
                  <h3 className="text-xl font-semibold mb-2 text-green-300">{repo.name}</h3>
                  <p className="text-gray-400 mb-4 text-sm">
                    {repo.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-green-400"></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {repo.stargazers_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {repo.forks_count}
                      </span>
                    </div>
                    <a 
                      href={repo.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <a 
              href="https://github.com/Vaarun-C" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
            >
              View all projects on GitHub <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <User className="text-emerald-400" />
              About Me
            </h2>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <p className="text-lg text-gray-300 mb-6">
              I'm a versatile software developer with experience across multiple domains of technology. 
              My journey has taken me through game development, big data processing, cloud infrastructure, 
              web development, AI/ML, backend systems, and networking - making me a true jack of all trades 
              with a particular passion for cloud technologies and backend development.
            </p>

            <h3 className="text-2xl font-semibold mb-4 text-green-300">Skills & Technologies</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {['Python', 'Java', 'AWS/Cloud', 'Docker', 'Kubernetes', 'Redis', 'React', 'MongoDB', 'PostgreSQL', 'NextJs', 'Git', 'Linux'].map((skill) => (
                <div key={skill} className="bg-gray-700 rounded-lg px-4 py-2 text-center">
                  {skill}
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-semibold mb-4 text-emerald-300">Professional Journey</h3>
            <p className="text-gray-300">
              My diverse experience spans game development engines, big data processing pipelines, 
              cloud infrastructure deployment, web applications, AI/ML model development, scalable backend systems, 
              and network architecture. This breadth of knowledge allows me to approach problems from multiple angles 
              and choose the right tools for each challenge. Currently, I'm most passionate about cloud technologies 
              and building robust, scalable backend systems.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Send className="text-green-400" />
              Get In Touch
            </h2>
            <p className="text-gray-400">Feel free to reach out for collaborations or just a friendly hello!</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-300 mb-6">
                I'm always interested in hearing about new opportunities and collaborations. 
                Feel free to reach out through any of the channels below!
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <a 
                href="mailto:varun.c.blr@gmail.com" 
                className="flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors"
              >
                <Mail size={24} className="text-green-400" />
                <span>Email Me</span>
              </a>
              
              <a 
                href="https://github.com/Vaarun-C" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors"
              >
                <Github size={24} className="text-gray-300" />
                <span>GitHub</span>
              </a>
              
              <a 
                href="https://www.linkedin.com/in/varun-c-75096a1b8/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors"
              >
                <Linkedin size={24} className="text-blue-500" />
                <span>LinkedIn</span>
              </a>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-400">
                <span className="font-semibold">Email:</span> varun.c.blr@gmail.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}