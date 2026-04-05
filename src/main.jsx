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
        // Request the API audience so Auth0 issues an access token
        // with your custom role claims attached
        ...(audience ? { audience } : {}),
      }}
      // Cache tokens in memory (safest default — use 'localstorage' for
      // persistent sessions across refreshes once you're in production)
      cacheLocation="memory"
    >
      <BrowserRouter>
        <DemoProvider>
          <App />
        </DemoProvider>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
)
