// components/Projects/DemoComponents.tsx
import React, { useState, useEffect } from 'react'
import { Play, Code, Send, Copy, Check, Terminal, FileText } from 'lucide-react'

// Terminal/CLI Demo Component
export const TerminalDemo: React.FC<{
  commands: Array<{
    command: string
    output: string
    description: string
  }>
}> = ({ commands }) => {
  const [currentCommand, setCurrentCommand] = useState(0)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const runCommand = async (commandIndex: number) => {
    setCurrentCommand(commandIndex)
    setIsRunning(true)
    setOutput('')
    
    const command = commands[commandIndex]
    
    // Simulate typing effect
    for (let i = 0; i <= command.output.length; i++) {
      setOutput(command.output.slice(0, i))
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    
    setIsRunning(false)
  }

  return (
    <div className="space-y-4">
      {/* Command Buttons */}
      <div className="space-y-2">
        {commands.map((cmd, index) => (
          <div key={index} className="space-y-1">
            <button
              onClick={() => runCommand(index)}
              disabled={isRunning}
              className="flex items-center gap-2 w-full text-left p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              <Terminal size={16} />
              <code className="text-sm">{cmd.command}</code>
            </button>
            <p className="text-xs text-gray-500 px-3">{cmd.description}</p>
          </div>
        ))}
      </div>

      {/* Terminal Output */}
      <div className="bg-black rounded-lg p-4 font-mono text-sm">
        <div className="text-green-400 mb-2">$ {commands[currentCommand]?.command}</div>
        <div className="text-gray-300 whitespace-pre-wrap">
          {output}
          {isRunning && <span className="animate-pulse">█</span>}
        </div>
      </div>
    </div>
  )
}

// Video Demo Component with controls
export const VideoDemo: React.FC<{
  videoUrl: string
  poster?: string
  description: string
}> = ({ videoUrl, poster, description }) => {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video
          controls
          poster={poster}
          className="w-full"
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          <p className="text-white p-4">
            Your browser doesn't support video playback. 
            <a href={videoUrl} className="underline">Download the video</a>
          </p>
        </video>
      </div>
    </div>
  )
}

// Interactive Web App Demo
export const WebAppDemo: React.FC<{
  demoUrl: string
  title: string
  description: string
}> = ({ demoUrl, title, description }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
      
      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading {title}...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={demoUrl}
          title={title}
          className="w-full h-full border-0"
          onLoad={() => setIsLoaded(true)}
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      </div>
      
      <div className="flex justify-center">
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Play size={16} />
          Open in New Tab
        </a>
      </div>
    </div>
  )
}

// Usage example in your project modal
export const ProjectDemoRenderer: React.FC<{
  project: {
    name: string
    demo_type?: string
    demo_url?: string
    api_endpoints?: any[]
    code_examples?: any[]
    terminal_commands?: any[]
  }
}> = ({ project }) => {
  switch (project.demo_type) {
    case 'terminal':
      return (
        <TerminalDemo
          commands={project.terminal_commands || [
            {
              command: 'npm install package-name',
              output: 'Installing package...\nSuccess!',
              description: 'Install the package'
            }
          ]}
        />
      )
    
    case 'video':
      return (
        <VideoDemo
          videoUrl={project.demo_url || ''}
          description={`Video demonstration of ${project.name}`}
        />
      )
    
    case 'iframe':
      return (
        <WebAppDemo
          demoUrl={project.demo_url || ''}
          title={project.name}
          description={`Interactive demo of ${project.name}`}
        />
      )
    
    default:
      return (
        <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500">Demo not available for this project</p>
        </div>
      )
  }
}