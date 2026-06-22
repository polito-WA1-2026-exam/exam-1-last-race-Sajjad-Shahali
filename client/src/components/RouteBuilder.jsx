import { Button, ListGroup, Badge } from 'react-bootstrap';

function RouteBuilder({ selectedSegmentIds = [], segmentMap = {}, startStationId, onUndo, onClear, onSubmit, submitted }) {
  // Walk route from start to show correct travel direction per segment
  const displaySegments = [];
  let currentId = startStationId ?? null;
  for (const segId of selectedSegmentIds) {
    const seg = segmentMap[segId];
    if (!seg) {
      displaySegments.push({ segId, label: `Segment #${segId}` });
      currentId = null;
    } else if (currentId === seg.station_a_id) {
      displaySegments.push({ segId, label: `${seg.station_a_name} → ${seg.station_b_name}` });
      currentId = seg.station_b_id;
    } else if (currentId === seg.station_b_id) {
      displaySegments.push({ segId, label: `${seg.station_b_name} → ${seg.station_a_name}` });
      currentId = seg.station_a_id;
    } else {
      // Disconnected — fall back to DB order
      displaySegments.push({ segId, label: `${seg.station_a_name} → ${seg.station_b_name}` });
      currentId = null;
    }
  }

  return (
    <div>
      <h6 className="fw-bold">Your Route ({selectedSegmentIds.length} segment{selectedSegmentIds.length !== 1 ? 's' : ''})</h6>

      {displaySegments.length === 0 ? (
        <p className="text-muted small">No segments selected yet. Click segments from the list.</p>
      ) : (
        <ListGroup className="mb-2" style={{ maxHeight: 240, overflowY: 'auto' }}>
          {displaySegments.map(({ segId, label }, idx) => (
            <ListGroup.Item key={`${idx}-${segId}`} className="py-1 small d-flex align-items-center gap-2">
              <Badge bg="secondary">{idx + 1}</Badge>
              {label}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <div className="d-flex gap-2 flex-wrap">
        <Button size="sm" variant="outline-secondary" onClick={onUndo} disabled={submitted || selectedSegmentIds.length === 0}>
          <i className="bi bi-arrow-counterclockwise me-1"></i>Undo
        </Button>
        <Button size="sm" variant="outline-danger" onClick={onClear} disabled={submitted || selectedSegmentIds.length === 0}>
          <i className="bi bi-trash me-1"></i>Clear
        </Button>
        <Button size="sm" variant="success" onClick={onSubmit} disabled={submitted}>
          <i className="bi bi-check-circle me-1"></i>{submitted ? 'Submitted' : 'Submit Route'}
        </Button>
      </div>
    </div>
  );
}

export default RouteBuilder;
