import './InfoOverlay.css';

type InfoOverlayProps = {
  title: string;
  description: string;
  onClose: () => void;
};

export default function InfoOverlay({
  title,
  description,
  onClose,
}: InfoOverlayProps) {
  return (
    <div className="info-overlay-layer">
      <aside className="info-overlay-card" aria-label="Panel informativo">
        <button
          type="button"
          className="info-overlay-close"
          onClick={onClose}
          aria-label="Cerrar panel informativo"
        >
          Cerrar
        </button>

        <div className="info-overlay-content">
          <p className="info-overlay-eyebrow">Monitoreo global</p>
          <h1 className="info-overlay-title">{title}</h1>
          <p className="info-overlay-description">{description}</p>
        </div>
      </aside>
    </div>
  );
}
