export interface Experience {
  id: number
  title: string
  company: string
  location: string
  duration: string
  description: string
  technologies: string[]
  type: 'work' | 'education' | 'project'
}

export interface Repo {
  id: number
  name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
}