'use client'

import { useState } from 'react'
import AddItemModal from './AddItemModal'

type DashboardClientProps = {
  children: React.ReactNode
}

export default function DashboardClient({ children }: DashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {children}
      <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

