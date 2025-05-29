'use client'

import React, { useState, useEffect } from 'react'
import { Code, ExternalLink } from 'lucide-react'
import { ProjectCard } from './ProjectCard'
import { Repo } from '@/types'

export const ProjectGrid: React.FC = () => {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGitHubRepos()
  }, [])

  const fetchGitHubRepos = async () => {
    try {
      const response = await fetch('https://api.github.com/users/Vaarun-C/repos?sort=updated&per_page=20')
      const data = await response.json()
      
      const ownRepos = data.filter((repo: Repo) => !repo.name.includes('fork') || repo.stargazers_count > 0 || repo.forks_count > 0)
      
      const sortedRepos = ownRepos.sort((a: Repo, b: Repo) => {
        if (b.stargazers_count !== a.stargazers_count) {
          return b.stargazers_count - a.stargazers_count
        }
        if (b.forks_count !== a.forks_count) {
          return b.forks_count - a.forks_count
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
      
      setRepos(sortedRepos.slice(0, 6))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching repos:', error)
      setLoading(false)
    }
  }

  return (
    <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Code className="text-green-400" />
            Projects
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Here are some of my top projects from GitHub (sorted by stars & activity)</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo) => (
              <ProjectCard key={repo.id} repo={repo} />
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
  )
}