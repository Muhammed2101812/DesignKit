'use client'

import { useAuthStore, useToolStore, useUIStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Test page to verify Zustand stores are working correctly
 * This page can be removed after testing
 */
export default function TestStoresPage() {
  const { user, profile, loading } = useAuthStore()
  const { currentTool, history, setCurrentTool, addToHistory, clearHistory } = useToolStore()
  const { sidebarOpen, theme, setSidebarOpen, setTheme, openModal, closeModal, isModalOpen } = useUIStore()

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Store Testing Page</h1>

      {/* Auth Store Test */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Auth Store</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
          <p><strong>Profile:</strong> {profile ? `${profile.full_name || 'No name'} (${profile.plan})` : 'No profile'}</p>
        </div>
      </Card>

      {/* Tool Store Test */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Tool Store</h2>
        <div className="space-y-4">
          <div>
            <p><strong>Current Tool:</strong> {currentTool || 'None'}</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => setCurrentTool('color-picker')}>
                Set Color Picker
              </Button>
              <Button onClick={() => setCurrentTool('image-cropper')}>
                Set Image Cropper
              </Button>
              <Button onClick={() => setCurrentTool(null)} variant="outline">
                Clear
              </Button>
            </div>
          </div>

          <div>
            <p><strong>History Count:</strong> {history.length}</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => addToHistory('color-picker', { color: '#FF5733' })}>
                Add Color
              </Button>
              <Button onClick={() => addToHistory('image-cropper', { width: 800, height: 600 })}>
                Add Crop
              </Button>
              <Button onClick={clearHistory} variant="destructive">
                Clear History
              </Button>
            </div>
            {history.length > 0 && (
              <div className="mt-2 text-sm">
                <p>Recent items:</p>
                <ul className="list-disc list-inside">
                  {history.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      {item.toolName} - {new Date(item.timestamp).toLocaleTimeString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* UI Store Test */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">UI Store</h2>
        <div className="space-y-4">
          <div>
            <p><strong>Sidebar Open:</strong> {sidebarOpen ? 'Yes' : 'No'}</p>
            <Button onClick={() => setSidebarOpen(!sidebarOpen)} className="mt-2">
              Toggle Sidebar
            </Button>
          </div>

          <div>
            <p><strong>Theme:</strong> {theme}</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => setTheme('light')} variant={theme === 'light' ? 'default' : 'outline'}>
                Light
              </Button>
              <Button onClick={() => setTheme('dark')} variant={theme === 'dark' ? 'default' : 'outline'}>
                Dark
              </Button>
              <Button onClick={() => setTheme('system')} variant={theme === 'system' ? 'default' : 'outline'}>
                System
              </Button>
            </div>
          </div>

          <div>
            <p><strong>Test Modal Open:</strong> {isModalOpen('test-modal') ? 'Yes' : 'No'}</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => openModal('test-modal', { message: 'Hello from modal!' })}>
                Open Modal
              </Button>
              <Button onClick={() => closeModal('test-modal')} variant="outline">
                Close Modal
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
