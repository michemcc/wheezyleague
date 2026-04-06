import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom'
import { DemoProvider } from './context/DemoContext'
import App from './App'
import './styles/globals.css'
import './styles/components.css'

const domain      = import.meta.env.VITE_AUTH0_DOMAIN
const clientId    = import.meta.env.VITE_AUTH0_CLIENT_ID
const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin
const audience    = import.meta.env.VITE_AUTH0_AUDIENCE

// After login, navigate to /dashboard (or the returnTo path if set).
// We use window.location so React Router picks up the new URL on remount.
function onRedirectCallback(appState) {
  const dest = appState?.returnTo || '/dashboard'
  window.location.replace(dest)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain || 'YOUR_AUTH0_DOMAIN'}
      clientId={clientId || 'YOUR_AUTH0_CLIENT_ID'}
      authorizationParams={{
        redirect_uri: redirectUri,
        ...(audience ? { audience } : {}),
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <BrowserRouter>
        <DemoProvider>
          <App />
        </DemoProvider>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
)
