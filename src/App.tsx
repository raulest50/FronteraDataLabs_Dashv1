import { useState } from 'react'
import './App.css'
import Globe from './components/Globe.tsx'
import InfoOverlay from './components/InfoOverlay.tsx'

function App() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true)

  return (
    <main className="app-shell">
      <section className="globe-stage" aria-label="Visualizacion del globo">
        <Globe />
        {isOverlayVisible ? (
          <InfoOverlay
            title="Frontera Data Labs"
            description="Bienvenido al sistema de telemetria mundial."
            onClose={() => setIsOverlayVisible(false)}
          />
        ) : null}
      </section>
    </main>
  )
}

export default App
