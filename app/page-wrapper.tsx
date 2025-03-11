'use client'

import dynamic from 'next/dynamic'

const HomePage = dynamic(() => import('@/app/page-content'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen w-screen bg-black text-white">
      <div className="text-xl">Loading TopicTrail...</div>
    </div>
  ),
})

export default function Home() {
  return <HomePage />
} 