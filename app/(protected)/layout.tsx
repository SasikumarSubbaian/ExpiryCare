import { ReactNode } from 'react'

/**
 * Protected Layout - Simple wrapper for protected route group
 * 
 * Authentication is handled by middleware.ts which:
 * - Checks user authentication before requests reach this layout
 * - Redirects unauthenticated users to /login
 * - Never throws errors
 * 
 * This layout is a simple pass-through since middleware handles all auth logic.
 * Child pages (like dashboard) are client components that fetch data via API routes.
 */
export default function ProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  // Middleware has already verified authentication
  // Just render children - no server-side logic needed
  return <>{children}</>
}

