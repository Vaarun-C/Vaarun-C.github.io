import React, { useState, useEffect } from 'react'
import { Code, ExternalLink, X, Play, Eye, Github, Calendar, Star, GitFork, Monitor, Database, Cpu, Globe, FileText, Bot } from 'lucide-react'
import { getProjectDetails } from '@/data/projects' // Add this import


// Enhanced Repo interface with additional project details
interface EnhancedRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  // Additional project details
  detailed_description?: string
  tech_stack?: string[]
  features?: string[]
  challenges?: string[]
  demo_type?: 'iframe' | 'video' | 'api' | 'images' | 'interactive'
  demo_url?: string
  screenshots?: string[]
  live_url?: string
  category?: 'web' | 'mobile' | 'backend' | 'ai' | 'game' | 'cli' | 'library'
  // Add these publication fields:
  publication_url?: string
  publication_title?: string
  publication_venue?: string  // e.g., "IEEE Conference", "arXiv", "Journal of AI"
  publication_date?: string   // e.g., "2024", "March 2024"
}

// Project categories with icons
const categoryIcons = {
  web: Globe,
  mobile: Monitor,
  backend: Database,
  ai: Cpu,
  game: Play,
  cli: Monitor,
  automation: Bot,
}

const ProjectModal: React.FC<{
  project: EnhancedRepo | null
  isOpen: boolean
  onClose: () => void
}> = ({ project, isOpen, onClose }) => {
  if (!isOpen || !project) return null

  const CategoryIcon = project.category ? categoryIcons[project.category] : Code

  // 3. Also update your renderDemo function to handle the case where files don't exist yet:
const renderDemo = () => {
  // Handle different demo types with proper validation
  if (!project.demo_type) {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
        <Eye className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-500 dark:text-gray-400">Demo not available</p>
      </div>
    )
  }

  // Check if demo is configured but files are missing
  const hasMissingFiles = () => {
    switch (project.demo_type) {
      case 'video':
        return !project.demo_url
      case 'iframe':
        return !project.demo_url
      case 'api':
        return false // API demos don't need files
      case 'images':
        return !project.screenshots || project.screenshots.length === 0
      case 'interactive':
        return false // Interactive demos don't need files
      default:
        return !project.demo_url
    }
  }

  if (hasMissingFiles()) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
        <Play className="mx-auto mb-4 text-blue-400" size={48} />
        <p className="text-blue-600 dark:text-blue-400 font-medium">Demo configured but media files pending</p>
        <p className="text-sm text-gray-500 mt-2">
          Demo type: {project.demo_type} | Files needed in public folder
        </p>
      </div>
    )
  }

  // Render the appropriate demo type
  switch (project.demo_type) {
    case 'iframe':
      return (
        <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          <iframe
            src={project.demo_url}
            className="w-full h-full"
            title={`${project.name} Demo`}
          />
        </div>
      )
    
    case 'video':
      return (
        <div className="relative w-full rounded-lg overflow-hidden">
          <video
            controls
            className="w-full rounded-lg"
            poster="/api/placeholder/600/400"
          >
            <source src={project.demo_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    
    case 'api':
      return (
        <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm">
          <div className="mb-4">
            <span className="text-blue-400">GET</span> /api/weather?city=bangalore
          </div>
          <div className="text-gray-300">
            {`{
  "city": "Bangalore",
  "temperature": 24,
  "humidity": 65,
  "description": "Partly cloudy"
}`}
          </div>
          <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
            Try API
          </button>
        </div>
      )
    
    case 'images':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.screenshots?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${project.name} screenshot ${index + 1}`}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow cursor-pointer"
              onError={(e) => {
                console.error(`Failed to load image: ${img}`)
                e.currentTarget.style.display = 'none'
              }}
            />
          ))}
        </div>
      )
    
    default:
      return (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center">
          <Play className="mx-auto mb-4" size={48} />
          <p>Interactive demo available</p>
          <button className="mt-4 px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Launch Demo
          </button>
        </div>
      )
  }
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CategoryIcon className="text-green-400" size={24} />
            <h2 className="text-2xl font-bold">{project.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Project Stats */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Star size={16} />
              {project.stargazers_count} stars
            </span>
            <span className="flex items-center gap-1">
              <GitFork size={16} />
              {project.forks_count} forks
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </span>
            {project.language && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                {project.language}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">About This Project</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {project.detailed_description || project.description}
            </p>
          </div>

          {/* Demo Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Live Demo</h3>
            {renderDemo()}
          </div>

          {/* Publication Section */}
          {project.publication_url && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Research Publication</h3>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <FileText className="text-green-600 dark:text-green-400 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                      {project.publication_title || "Research Paper"}
                    </h4>
                    {project.publication_venue && (
                      <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                        Published in: {project.publication_venue}
                        {project.publication_date && ` (${project.publication_date})`}
                      </p>
                    )}
                    <a
                      href={project.publication_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Read Paper
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {project.tech_stack && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Technology Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {project.features && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {project.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges */}
          {project.challenges && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Technical Challenges</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {project.challenges.map((challenge, index) => (
                  <li key={index}>{challenge}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <a
              href={project.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Github size={20} />
              View Code
            </a>
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink size={20} />
                Live Site
              </a>
            )}

            {/* NEW: Publication Button */}
            {project.publication_url && (
              <a
                href={project.publication_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText size={20} />
                Read Paper
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ProjectCard: React.FC<{
  repo: EnhancedRepo
  onClick: () => void
}> = ({ repo, onClick }) => {
  const CategoryIcon = repo.category ? categoryIcons[repo.category] : Code
  
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CategoryIcon className="text-green-400" size={20} />
          <h3 className="text-xl font-semibold text-green-600 dark:text-green-300 group-hover:text-green-500">
            {repo.name}
          </h3>
        </div>
        
        {/* Indicators Container */}
        <div className="flex flex-col gap-1">
          {repo.demo_type && (
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
              <Play size={12} />
              Demo
            </div>
          )}
          
          {/* NEW: Publication Indicator */}
          {repo.publication_url && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
              <FileText size={12} />
              Paper
            </div>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-2">
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
            <Star size={12} />
            {repo.stargazers_count}
          </span>
          <span className="flex items-center gap-1">
            <GitFork size={12} />
            {repo.forks_count}
          </span>
        </div>
        <div className="text-green-400 group-hover:text-green-300 transition-colors">
          <Eye size={20} />
        </div>
      </div>
    </div>
  )
}

export const ProjectGrid: React.FC = () => {
  const [repos, setRepos] = useState<EnhancedRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<EnhancedRepo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const customRepoOrder: Record<string, number> = {
    'DiagramsToCode': 1,
    'NEAT-cars': 2,
    'Ki': 3,
    'YoutubeFS': 4,
    'STARC-Wide-ball-detection': 5,
    'WaveFunctionCollapse': 6
  }

  useEffect(() => {
    fetchGitHubRepos()
  }, [])

  const fetchGitHubRepos = async () => {
    try {
      const response = await fetch('https://api.github.com/users/Vaarun-C/repos?sort=updated&per_page=20')
      const data = await response.json()
      
      const ownRepos = data.filter((repo: any) => !repo.name.includes('fork') || repo.stargazers_count > 0 || repo.forks_count > 0)
      
      const sortedRepos = ownRepos.sort((a: any, b: any) => {
        if (b.stargazers_count !== a.stargazers_count) {
          return b.stargazers_count - a.stargazers_count
        }

        const orderA = customRepoOrder[a.name] ?? 999 // Default to 999 if not in custom order
        const orderB = customRepoOrder[b.name] ?? 999
        
        if (orderA !== orderB) {
          return orderA - orderB // Lower order number = higher priority
        }

        if (b.forks_count !== a.forks_count) {
          return b.forks_count - a.forks_count
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
      
      // FIXED: Properly enhance repos with additional data
      const enhancedRepos = sortedRepos.slice(0, 9).map((repo: any) => ({
        ...repo,
        ...getProjectDetails(repo.name) // This line was commented out - now it's active!
      }))
      
      setRepos(enhancedRepos)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching repos:', error)
      setLoading(false)
    }
  }

  const handleProjectClick = (project: EnhancedRepo) => {
    setSelectedProject(project)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedProject(null)
  }

  return (
    <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Code className="text-green-400" />
            Projects
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Click on any project to see detailed information and live demos
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo) => (
              <ProjectCard 
                key={repo.id} 
                repo={repo} 
                onClick={() => handleProjectClick(repo)}
              />
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

      <ProjectModal 
        project={selectedProject}
        isOpen={modalOpen}
        onClose={closeModal}
      />
    </section>
  )
}