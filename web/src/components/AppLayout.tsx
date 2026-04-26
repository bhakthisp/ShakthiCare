import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'

export function AppLayout() {
  return (
    <div className="app-bg min-h-dvh">
      <TopNav />
      <main className="px-6">
        <div className="mx-auto w-full max-w-6xl py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

