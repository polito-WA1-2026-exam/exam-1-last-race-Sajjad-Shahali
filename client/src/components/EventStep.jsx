import { Card, Badge } from 'react-bootstrap';

function EventStep({ step, position }) {
  const { stationFrom, stationTo, event, coinsAfter } = step;
  const effect = event?.coin_effect ?? 0;
  const effectPositive = effect > 0;
  const effectNeutral = effect === 0;

  return (
    <Card className="mb-2 shadow-sm">
      <Card.Body className="py-2 px-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Badge bg="secondary" className="me-2">Step {position}</Badge>
            <span className="small fw-semibold">
              {stationFrom?.name} → {stationTo?.name}
            </span>
          </div>
          <span className="small text-muted">{coinsAfter} coins</span>
        </div>
        <div className="mt-1 small d-flex align-items-center gap-2">
          <i className="bi bi-lightning"></i>
          <span>{event?.description}</span>
          <Badge bg={effectPositive ? 'success' : effectNeutral ? 'secondary' : 'danger'}>
            {effectPositive ? '+' : ''}{effect}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
}

export default EventStep;
