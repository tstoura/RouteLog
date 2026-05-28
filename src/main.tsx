import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import './styles/index.css'

// AuthProvider is mounted inside the router (src/app/router.tsx → RootWithAuth)
// so that AuthContext can call useNavigate() for post-logout navigation.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
