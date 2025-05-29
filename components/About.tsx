import React from 'react'
import { User } from 'lucide-react'

const skills = [
  'Python', 
  'Java', 
  'AWS/Cloud', 
  'Docker', 
  'Kubernetes', 
  'Redis', 
  'React', 
  'MongoDB', 
  'PostgreSQL', 
  'NextJs', 
  'Git', 
  'Linux'
]

export const About: React.FC = () => {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <User className="text-emerald-400" />
            About Me
          </h2>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            I'm a versatile software developer with experience across multiple domains of technology. 
            My journey has taken me through game development, big data processing, cloud infrastructure, 
            web development, AI/ML, backend systems, and networking - making me a true jack of all trades 
            with a particular passion for cloud technologies and backend development.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-green-600 dark:text-green-300">Skills & Technologies</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {skills.map((skill) => (
              <div key={skill} className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-center border border-gray-200 dark:border-gray-600">
                {skill}
              </div>
            ))}
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-300">Professional Journey</h3>
          <p className="text-gray-700 dark:text-gray-300">
            My diverse experience spans game development engines, big data processing pipelines, 
            cloud infrastructure deployment, web applications, AI/ML model development, scalable backend systems, 
            and network architecture. This breadth of knowledge allows me to approach problems from multiple angles 
            and choose the right tools for each challenge. Currently, I'm most passionate about cloud technologies 
            and building robust, scalable backend systems.
          </p>
        </div>
      </div>
    </section>
  )
}