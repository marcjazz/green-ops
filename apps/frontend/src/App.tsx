import React from 'react'
import { useAuth } from 'react-oidc-context'
import { apiClient } from './api/apiClient.js'

function App() {
  const auth = useAuth()

  if (auth.isLoading) return <div>Loading...</div>
  if (auth.error) return <div>Oops... {auth.error.message}</div>

  if (!auth.isAuthenticated) {
    return <button onClick={() => auth.signinRedirect()}>Login</button>
  }

  const fetchAlerts = async () => {
    try {
      const response = await apiClient.get('/alerts')
      console.log(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="App">
      <h1>GreenOps Platform</h1>
      <p>Hello {auth.user?.profile.sub}</p>
      <button onClick={() => auth.signoutRedirect()}>Logout</button>
      <button onClick={fetchAlerts}>Fetch Alerts</button>
    </div>
  )
}

export default App
