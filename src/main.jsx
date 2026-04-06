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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain || 'YOUR_AUTH0_DOMAIN'}
      clientId={clientId || 'YOUR_AUTH0_CLIENT_ID'}
      authorizationParams={{
        redirect_uri: redirectUri,
        // audience is required for Auth0 to issue an access token
        // which is what carries the custom role claims
        ...(audience ? { audience } : {}),
      }}
      // localstorage: tokens survive page refresh so users don't lose their session.
      // Roles are read from the access token on mount (see useAuth.js).
      // Note: memory is safer on shared devices, but causes role loss on refresh.
      cacheLocation="localstorage"
      // Re-use existing session silently on load — avoids redirect loop on refresh
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
