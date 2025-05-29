import React from 'react'
import { Calendar } from 'lucide-react'
import { experienceData } from '@/data/experience'
import { ExperienceCard } from './ExperienceCard'

export const Timeline: React.FC = () => {
  const nodeColors = {
    work: 'bg-green-400 border-green-400',
    education: 'bg-blue-400 border-blue-400',
    project: 'bg-purple-400 border-purple-400'
  }

  return (
    <section id="experience" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Calendar className="text-emerald-400" />
            Experience Journey
          </h2>
          <p className="text-gray-500 dark:text-gray-400">My professional and educational timeline</p>
        </div>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-emerald-500 to-green-600"></div>
          
          {experienceData.map((exp) => (
            <div key={exp.id} className="relative mb-12 ml-16">
              {/* Timeline Node */}
              <div className="absolute -left-10 top-4">
                <div className={`w-4 h-4 rounded-full border-4 ${nodeColors[exp.type]}`}></div>
              </div>
              
              <ExperienceCard experience={exp} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}