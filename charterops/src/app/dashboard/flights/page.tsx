"use client"
import { Suspense } from 'react'
import FlightsPageContent from './FlightsPageContent'

export default function FlightsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FlightsPageContent />
    </Suspense>
  )
} 