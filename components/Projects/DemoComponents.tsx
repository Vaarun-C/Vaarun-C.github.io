// components/Projects/DemoComponents.tsx
import React, { useState, useEffect } from 'react'
import { Play, Code, Send, Copy, Check, Terminal, FileText } from 'lucide-react'

// API Demo Component with interactive testing
export const ApiDemo: React.FC<{ 
  apiUrl: string
  endpoints: Array<{
    method: string
    path: string
    description: string
    sampleRequest?: any
    sampleResponse: any
  }>
}> = ({ apiUrl, endpoints }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(0)
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const endpoint = endpoints[selectedEndpoint]

  useEffect(() => {
    if (endpoint.sampleRequest) {
      setRequestBody(JSON.stringify(endpoint.sampleRequest, null, 2))
    }
  }, [selectedEndpoint, endpoint])

  const makeRequest = async () => {
    setLoading(true)
    try {
      // Simulate API call (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setResponse(JSON.stringify(endpoint.sampleResponse, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  const copyResponse = () => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Endpoint Selector */}
      <div className="flex flex-wrap gap-2">
        {endpoints.map((ep, index) => (
          <button
            key={index}
            onClick={() => setSelectedEndpoint(index)}
            className={`px-3 py-1 rounded text-sm font-mono ${
              index === selectedEndpoint
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {ep.method} {ep.path}
          </button>
        ))}
      </div>

      {/* Current Endpoint Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
            endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {endpoint.method}
          </span>
          <code className="text-sm">{apiUrl}{endpoint.path}</code>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{endpoint.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Request Section */}
        <div>
          <h4 className="text-lg font-semibold mb-3">Request</h4>
          {endpoint.sampleRequest && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Request Body:</label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full h-32 p-3 bg-gray-900 text-green-400 font-mono text-sm rounded-lg border border-gray-600"
                placeholder="Request body (JSON)"
              />
            </div>
          )}
          <button
            onClick={makeRequest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send size={16} />
            )}
            Send Request
          </button>
        </div>

        {/* Response Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold">Response</h4>
            {response && (
              <button
                onClick={copyResponse}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="h-40 p-3 bg-gray-900 text-green-400 font-mono text-sm rounded-lg border border-gray-600 overflow-auto">
            {response || 'Response will appear here...'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Code Example Component with syntax highlighting (simplified)
export const CodeDemo: React.FC<{
  examples: Array<{
    language: string
    title: string
    code: string
    description: string
  }>
}> = ({ examples }) => {
  const [selectedExample, setSelectedExample] = useState(0)
  const [copied, setCopied] = useState(false)

  const example = examples[selectedExample]

  const copyCode = () => {
    navigator.clipboard.writeText(example.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Example Selector */}
      <div className="flex flex-wrap gap-2">
        {examples.map((ex, index) => (
          <button
            key={index}
            onClick={() => setSelectedExample(index)}
            className={`px-3 py-1 rounded text-sm ${
              index === selectedExample
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {ex.title}
          </button>
        ))}
      </div>

      {/* Example Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{example.description}</p>
      </div>

      {/* Code Block */}
      <div className="relative">
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
          <span className="text-sm text-gray-300">{example.language}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
          <code>{example.code}</code>
        </pre>
      </div>
    </div>
  )
}

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
    case 'api':
      return (
        <ApiDemo
          apiUrl="https://api.example.com"
          endpoints={project.api_endpoints || [
            {
              method: 'GET',
              path: '/status',
              description: 'Check API status',
              sampleResponse: { status: 'ok', version: '1.0.0' }
            }
          ]}
        />
      )
    
    case 'code':
      return (
        <CodeDemo
          examples={project.code_examples || [
            {
              language: 'javascript',
              title: 'Basic Usage',
              code: 'console.log("Hello World!")',
              description: 'Simple example of the library usage'
            }
          ]}
        />
      )
    
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