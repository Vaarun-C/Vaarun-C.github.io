import React from 'react'
import { ExternalLink } from 'lucide-react'
import { Repo } from '@/types'

interface ProjectCardProps {
  repo: Repo
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ repo }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-300">{repo.name}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
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
  )
}