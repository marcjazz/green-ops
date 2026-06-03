import React, { useState, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { apiClient } from './api/apiClient.js'

function App() {
  const auth = useAuth()
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (auth.isAuthenticated) {
      apiClient.get('/alerts').then(res => setAlerts(res.data.data))
    }
  }, [auth.isAuthenticated])

  if (auth.isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>
  if (auth.error) return <div>Oops... {auth.error.message}</div>

  if (!auth.isAuthenticated) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">GreenOps Platform</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => auth.signinRedirect()}>Login</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold">GreenOps Dashboard</h1>
          <button className="text-red-500" onClick={() => auth.signoutRedirect()}>Logout</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
          {alerts.length === 0 ? <p>No active alerts.</p> : (
            <ul>
              {alerts.map((alert: any) => (
                <li key={alert.id} className="border-b py-2">{alert.title} - {alert.severity}</li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
