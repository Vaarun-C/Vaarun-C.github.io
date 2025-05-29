import React from 'react'
import { Building, Calendar, MapPin } from 'lucide-react'
import { Experience } from '@/types'

interface ExperienceCardProps {
  experience: Experience
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience }) => {
  const typeStyles = {
    work: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    education: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    project: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-green-300 mb-1">
            {experience.title}
          </h3>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Building size={16} />
            <span className="font-medium">{experience.company}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {experience.duration}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {experience.location}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeStyles[experience.type]}`}>
          {experience.type.charAt(0).toUpperCase() + experience.type.slice(1)}
        </span>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {experience.description}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {experience.technologies.map((tech) => (
          <span 
            key={tech}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}