import React from 'react'
import { Send, Mail, Github, Linkedin } from 'lucide-react'

export const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Send className="text-green-400" />
            Get In Touch
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Feel free to reach out for collaborations or just a friendly hello!</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              I'm always interested in hearing about new opportunities and collaborations. 
              Feel free to reach out through any of the channels below!
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <a 
              href="mailto:varun.c.blr@gmail.com" 
              className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-4 transition-colors"
            >
              <Mail size={24} className="text-green-400" />
              <span>Email Me</span>
            </a>
            
            <a 
              href="https://github.com/Vaarun-C" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-4 transition-colors"
            >
              <Github size={24} className="text-gray-600 dark:text-gray-300" />
              <span>GitHub</span>
            </a>
            
            <a 
              href="https://www.linkedin.com/in/varun-c-75096a1b8/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-4 transition-colors"
            >
              <Linkedin size={24} className="text-blue-500" />
              <span>LinkedIn</span>
            </a>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Email:</span> varun.c.blr@gmail.com
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}