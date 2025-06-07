// data/projects.ts
export interface ProjectDetails {
  name: string
  detailed_description: string
  tech_stack: string[]
  features: string[]
  challenges?: string[]
  demo_type: 'iframe' | 'video' | 'api' | 'images' | 'interactive' | 'none'
  demo_url?: string
  screenshots?: string[]
  live_url?: string
  category: 'web' | 'mobile' | 'backend' | 'ai' | 'game' | 'cli' | 'automation'
  architecture?: string
  performance_metrics?: {
    metric: string
    value: string
  }[]
  // Add these publication fields:
  publication_url?: string
  publication_title?: string
  publication_venue?: string  // e.g., "IEEE Conference", "arXiv", "Journal of AI"
  publication_date?: string   // e.g., "2024", "March 2024"
}


export const projectDetailsMap: Record<string, ProjectDetails> = {
  // Web Applications
//   'portfolio-website': {
//     name: 'Portfolio Website',
//     detailed_description: 'A modern, responsive portfolio website built with Next.js 15 and TypeScript. Features include dark/light mode with system preference detection, smooth animations, GitHub API integration for dynamic project display, and SEO optimization. The site uses Tailwind CSS for styling and is deployed on Vercel with automatic deployments.',
//     tech_stack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'GitHub API', 'Vercel'],
//     features: [
//       'Responsive design that works on all devices',
//       'Dark/Light theme with system preference detection',
//       'Smooth scrolling navigation',
//       'GitHub API integration for dynamic project loading',
//       'SEO optimized with meta tags',
//       'Performance optimized with Next.js features',
//       'Accessibility compliant (WCAG 2.1)'
//     ],
//     challenges: [
//       'Theme persistence across page reloads without flash',
//       'Implementing smooth scroll behavior across different browsers',
//       'Handling GitHub API rate limiting for anonymous requests',
//       'Optimizing bundle size and performance scores'
//     ],
//     demo_type: 'iframe',
//     demo_url: 'https://your-portfolio.vercel.app',
//     category: 'web',
//     screenshots: ['/screenshots/portfolio-dark.png', '/screenshots/portfolio-light.png'],
//     live_url: 'https://your-portfolio.vercel.app',
//     performance_metrics: [
//       { metric: 'Lighthouse Performance', value: '98/100' },
//       { metric: 'First Contentful Paint', value: '1.2s' },
//       { metric: 'Bundle Size', value: '< 100KB gzipped' }
//     ]
//   },

//   // AI/ML Projects
//   'sentiment-analyzer': {
//     name: 'Sentiment Analysis API',
//     detailed_description: 'A real-time sentiment analysis API built with FastAPI and transformers. Uses BERT-based models for accurate sentiment classification with support for multiple languages. Includes caching layer with Redis, rate limiting, and comprehensive API documentation.',
//     tech_stack: ['Python', 'FastAPI', 'Transformers', 'BERT', 'Redis', 'Docker'],
//     features: [
//       'Real-time sentiment analysis',
//       'Support for multiple languages',
//       'BERT-based model for high accuracy',
//       'Redis caching for performance',
//       'Rate limiting and authentication',
//       'Interactive API documentation',
//       'Docker containerization'
//     ],
//     challenges: [
//       'Model optimization for inference speed',
//       'Memory management for large models',
//       'Implementing efficient caching strategies',
//       'Handling concurrent requests'
//     ],
//     demo_type: 'api',
//     category: 'ai',
//     architecture: 'Microservices with FastAPI, Redis cache, and PostgreSQL for analytics'
//   },

//   // Backend Systems
//   'distributed-chat': {
//     name: 'Distributed Chat System',
//     detailed_description: 'A scalable real-time chat application built with microservices architecture. Features include real-time messaging with WebSocket, message persistence, user authentication, and horizontal scaling capabilities.',
//     tech_stack: ['Node.js', 'Socket.io', 'Redis', 'MongoDB', 'Docker', 'Kubernetes'],
//     features: [
//       'Real-time messaging with WebSocket',
//       'Horizontal scaling with Redis pub/sub',
//       'Message persistence and history',
//       'User authentication and authorization',
//       'Rate limiting and spam protection',
//       'File upload and sharing',
//       'Push notifications'
//     ],
//     challenges: [
//       'Scaling WebSocket connections across multiple servers',
//       'Implementing consistent message ordering',
//       'Handling connection recovery and offline scenarios',
//       'Managing state synchronization'
//     ],
//     demo_type: 'interactive',
//     category: 'backend',
//     architecture: 'Microservices with API Gateway, Redis for pub/sub, MongoDB for persistence'
//   },

//   // Game Development
//   'chess-engine': {
//     name: 'Chess Engine with AI',
//     detailed_description: 'A fully functional chess engine with AI opponent implemented using minimax algorithm with alpha-beta pruning. Features include move validation, checkmate detection, multiple difficulty levels, and a clean GUI built with Pygame.',
//     tech_stack: ['Python', 'Pygame', 'Minimax Algorithm', 'Alpha-Beta Pruning'],
//     features: [
//       'Complete chess rule implementation',
//       'AI opponent with adjustable difficulty',
//       'Move validation and legal move generation',
//       'Checkmate and stalemate detection',
//       'Move history and undo functionality',
//       'Clean and intuitive GUI',
//       'Performance optimizations'
//     ],
//     challenges: [
//       'Optimizing minimax algorithm for deeper search',
//       'Implementing all chess rules correctly',
//       'Balancing AI difficulty levels',
//       'Efficient board representation and move generation'
//     ],
//     demo_type: 'video',
//     demo_url: '/videos/chess-demo.mp4',
//     category: 'game',
//     performance_metrics: [
//       { metric: 'Search Depth', value: '6-8 moves' },
//       { metric: 'Positions/Second', value: '50,000+' },
//       { metric: 'Memory Usage', value: '< 50MB' }
//     ]
//   },

//   // CLI Tools
//   'file-organizer': {
//     name: 'Smart File Organizer',
//     detailed_description: 'A command-line tool that automatically organizes files based on type, date, or custom rules. Features include batch processing, undo functionality, and configuration file support.',
//     tech_stack: ['Python', 'Click', 'Watchdog', 'YAML'],
//     features: [
//       'Automatic file organization by type/date',
//       'Custom organization rules via config',
//       'Real-time file watching',
//       'Batch processing of existing files',
//       'Undo functionality',
//       'Detailed logging and reports'
//     ],
//     challenges: [
//       'Handling file conflicts and duplicates',
//       'Implementing safe file operations',
//       'Cross-platform compatibility',
//       'Performance with large directories'
//     ],
//     demo_type: 'video',
//     demo_url: '/videos/file-organizer-demo.mp4',
//     category: 'cli'
//   },

    "NEAT-cars": {
        name: "NEAT Cars - Neural Evolution",
        detailed_description: "An implementation of NeuroEvolution of Augmenting Topologies (NEAT) algorithm where AI cars learn to navigate user drawn racing tracks through genetic evolution. Cars start with random behaviors and evolve over several generations to master driving, developing optimal neural networks through natural selection.",
        
        tech_stack: [
            "Python",
            "Pygame", 
            "NEAT Algorithm",
            "Neural Networks",
            "Genetic Algorithm",
            "Machine Learning"
        ],
        
        features: [
            "Real-time neural network evolution",
            "Population-based learning", 
            "Dynamic topology evolution",
            "Fitness-based natural selection",
            "Advanced collision detection",
            "User drawn track layouts"
        ],
        
        demo_type: "video", // Custom demo type
        demo_url: "/videos/NEATCarsDemo.mp4",
        
        category: "ai",
        live_url: undefined, // No live web version
    },

    "DiagramsToCode": {
        name: "Diagrams To Code",
        detailed_description: "An application to automatically generate CloudFormation Infrastructure As Code (IaC) templates from given AWS architectures.",
        
        tech_stack: [
            "Python",
            "YOLOv8", 
            "Cloud",
            "Automation",
            "Machine Learning"
        ],
        
        features: [
            "Automated Cloud Infrastructure Generation"
        ],
        
        demo_type: "video", // Custom demo type
        demo_url: "/videos/DiagramsToCodeDemo.mp4",
        
        category: "ai",
        live_url: undefined, // No live web version

        // Add publication information:
        publication_url: "https://arxiv.org/abs/your-paper-id",  // Your paper URL
        publication_title: "From Diagrams to Code: An Exploration into Automated Cloud Template Creation",
        publication_venue: "International Conference on Electronics Information and Emergency Communication",
        publication_date: "2025"
    },

    "WaveFunctionCollapse": {
        name: "Wave Function Collapse",
        detailed_description: "My implementation of the Wave Function Collapse Algorithm to generate platforming levels",
        
        tech_stack: [
            "Python",
            "Pygame", 
            "Wave Function Collapse Algorithm"
        ],
        
        features: [
            "Generation of varying sizes of platforming levels"
        ],
        
        demo_type: "video", // Custom demo type
        demo_url: "/videos/WaveFunctionCollapseDemo.mp4",
        
        category: "game",
        live_url: undefined,
    },

    "Ki": {
      name: "Ki",
      detailed_description: "Ki is an automated Discord bot controller that simulates user activity to maximize Pokémon capture efficiency in PokéTwo. It leverages Selenium-driven clients and intelligent task routing to automate spawns, captures, and marketplace listings.",
      
      tech_stack: [
          "Python",
          "Selenium",
          "Heroku",
          "Firebase (Firestore)",
          "Docker",
          "Kubernetes",
          "Discord API"
      ],
      
      features: [
          "Automated spawning and capturing of Pokémon in PokéTwo",
          "Simulated message traffic to trigger spawns",
          "Real-time capture and sale logging to Firebase",
          "Dynamic pricing and listing strategy based on marketplace thresholds",
          "Containerized worker pods managed via Kubernetes",
          "Resilient microservice architecture with modular task routing"
      ],
      
      demo_type: "images", 
      screenshots: [
        "/screenshots/Ki1.png"
      ],
      
      category: "automation",
      live_url: undefined
  }

}

// Helper function to get project details
export const getProjectDetails = (repoName: string): Partial<ProjectDetails> => {
  return projectDetailsMap[repoName] || {}
}

// Categories for filtering (optional feature)
export const projectCategories = [
  { id: 'all', name: 'All Projects', icon: 'Code' },
  { id: 'web', name: 'Web Apps', icon: 'Globe' },
  { id: 'backend', name: 'Backend', icon: 'Database' },
  { id: 'ai', name: 'AI/ML', icon: 'Cpu' },
  { id: 'game', name: 'Games', icon: 'Play' },
  { id: 'cli', name: 'CLI Tools', icon: 'Monitor' },
  { id: 'automation', name: 'Automations', icon: 'Bot' }
]