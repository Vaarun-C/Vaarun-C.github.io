import { Experience } from '@/types'

export const experienceData: Experience[] = [
  {
    id: 1,
    title: "Teaching Assistant - Big Data",
    company: "PES University",
    location: "Bangalore, India",
    duration: "July 2024 - Present",
    description: "Designed and graded Spark assignments for 200+ students, ensuring comprehensive coverage of distributed data processing concepts. Reviewed and provided feedback on distributed systems projects including Kafka task queues, multi-client file transfer systems, and real-time log management frameworks.",
    technologies: ["Kafka", "Spark", "Hadoop", "Distributed Systems"],
    type: "work"
  },
  {
    id: 2,
    title: "Software Engineering Intern",
    company: "AVEVA",
    location: "Bangalore, India",
    duration: "June 2024 - July 2024",
    description: "Created interactive data visualization charts with real-time data streams and drill-down functionality. Engineered high-performance API with asynchronous request handling, reducing data retrieval times from 40 seconds to 2 seconds—a 95% improvement.",
    technologies: [".NET Core", "Entity Framework", "SQL", "RxJS", "Angular"],
    type: "work"
  },
  {
    id: 3,
    title: "Full Stack Developer Intern",
    company: "Snow Mountain AI",
    location: "Bangalore, India",
    duration: "June 2023 - Aug 2023",
    description: "Led database migration from team-based to organization and project-based schema. Revamped the company website frontend, enhancing user experience while maintaining compatibility with the new database structure.",
    technologies: ["Supabase", "PostgreSQL", "NextJS", "ExpressJS"],
    type: "work"
  },
  {
    id: 4,
    title: "Computer Vision Intern",
    company: "STARC-PESU",
    location: "Bangalore, India",
    duration: "June 2023 - July 2023",
    description: "Designed computer vision system for cricket ball tracking and wide ball detection with 90% accuracy. Integrated ball trajectory and pose data into Unity3D visualization, processing real-time data at 60 fps.",
    technologies: ["OpenCV", "TensorFlow", "MediaPipe", "Unity3D", "Python"],
    type: "work"
  }
]