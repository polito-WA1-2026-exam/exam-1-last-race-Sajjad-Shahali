import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import * as API from '../API.js';
import MetroMap from '../components/MetroMap.jsx';
import SegmentList from '../components/SegmentList.jsx';
import RouteBuilder from '../components/RouteBuilder.jsx';
import CountdownTimer from '../components/CountdownTimer.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

function PlanningPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const submittedRef = useRef(false);
  const selectedIdsRef = useRef([]);

  useEffect(() => {
    API.getGame(gameId)
      .then(g => {
        if (g.phase !== 'planning') {
          // Redirect to correct phase
          if (g.phase === 'execution') navigate(`/execution/${gameId}`, { replace: true });
          else navigate(`/result/${gameId}`, { replace: true });
          return;
        }
        setGame(g);
        const initial = g.routeSegmentIds || [];
        selectedIdsRef.current = initial;
        setSelectedSegmentIds(initial);
      })
      .catch(err => setError(err.message || 'Failed to load game.'))
      .finally(() => setLoading(false));
  }, [gameId, navigate]);

  // Build segmentMap for RouteBuilder display
  const segmentMap = {};
  if (game?.segments) {
    for (const seg of game.segments) segmentMap[seg.id] = seg;
  }

  // Build stationMap for name lookup
  const stationMap = {};
  if (game?.stations) {
    for (const s of game.stations) stationMap[s.id] = s;
  }

  // Compute current station from route progress
  let currentStationId = game?.startStation?.id ?? null;
  for (const segId of selectedSegmentIds) {
    const seg = segmentMap[segId];
    if (!seg) break;
    currentStationId = seg.station_a_id === currentStationId ? seg.station_b_id : seg.station_a_id;
  }
  const currentStationName = stationMap[currentStationId]?.name ?? '';

  const usedIds = new Set(selectedSegmentIds);

  const doSubmit = useCallback(async (segIds) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    try {
      const result = await API.submitRoute(gameId, segIds);
      if (result.phase === 'execution') {
        navigate(`/execution/${gameId}`);
      } else {
        navigate(`/result/${gameId}`);
      }
    } catch (err) {
      setError(err.message || 'Submission failed.');
      submittedRef.current = false;
      setSubmitted(false);
    }
  }, [gameId, navigate]);

  const handleAddSegment = async (segId) => {
    const newIds = [...selectedIdsRef.current, segId];
    selectedIdsRef.current = newIds;
    setSelectedSegmentIds(newIds);
    try {
      await API.saveRoute(gameId, newIds);
    } catch (err) {
      setError('Draft save failed — submitted route may differ from displayed route.');
      console.warn('saveRoute error:', err);
    }
  };

  const handleUndo = async () => {
    const newIds = selectedIdsRef.current.slice(0, -1);
    selectedIdsRef.current = newIds;
    setSelectedSegmentIds(newIds);
    try { await API.saveRoute(gameId, newIds); } catch (err) { console.warn('saveRoute error:', err); }
  };

  const handleClear = async () => {
    selectedIdsRef.current = [];
    setSelectedSegmentIds([]);
    try { await API.saveRoute(gameId, []); } catch (err) { console.warn('saveRoute error:', err); }
  };

  const handleExpire = useCallback(() => {
    doSubmit(selectedIdsRef.current);
  }, [doSubmit]);

  const handleSubmit = () => doSubmit(selectedIdsRef.current);

  if (loading) return <LoadingSpinner text="Loading planning phase…" />;
  if (!game) return <ErrorAlert error={error || 'Game not found.'} />;

  const highlightIds = [game.startStation?.id, game.destinationStation?.id].filter(Boolean);
  const startId = game.startStation?.id ?? null;
  const destId  = game.destinationStation?.id ?? null;

  return (
    <div className="page-bg home-bg">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">
            <span className="badge bg-success me-2">START</span>
            {game.startStation?.name}
            <i className="bi bi-arrow-right mx-2"></i>
            <span className="badge bg-danger me-2">DEST</span>
            {game.destinationStation?.name}
          </h5>
          <small className="text-muted">Build your route by selecting segments in order from the list.</small>
        </div>
        {game.deadline && (
          <CountdownTimer deadline={game.deadline} onExpire={handleExpire} />
        )}
      </div>

      <ErrorAlert error={error} onClose={() => setError('')} />
      {submitted && <Alert variant="info"><i className="bi bi-hourglass me-2"></i>Submitting your route…</Alert>}

      <Row>
        <Col md={6} lg={7}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="py-2 bg-light">
              <strong><i className="bi bi-map me-2"></i>Station Map</strong>
              <small className="text-muted ms-2">(no lines shown – use the segment list)</small>
            </Card.Header>
            <Card.Body>
              <MetroMap
                stations={game.stations || []}
                segments={game.segments || []}
                lines={[]}
                lineStations={[]}
                showLines={false}
                highlightIds={highlightIds}
                startId={startId}
                destId={destId}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={5}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="py-2 bg-light d-flex justify-content-between align-items-center">
              <strong><i className="bi bi-arrow-right-circle me-2"></i>Next Stop</strong>
              <small className="text-muted">
                <i className="bi bi-geo-alt-fill me-1"></i>{currentStationName}
              </small>
            </Card.Header>
            <Card.Body className="p-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
              <SegmentList
                segments={(game.segments || []).filter(seg => !usedIds.has(seg.id))}
                selectedSegmentIds={selectedSegmentIds}
                onAddSegment={handleAddSegment}
                disabled={submitted}
              />
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="py-2 bg-light">
              <strong><i className="bi bi-signpost me-2"></i>Your Route</strong>
            </Card.Header>
            <Card.Body>
              <RouteBuilder
                selectedSegmentIds={selectedSegmentIds}
                segmentMap={segmentMap}
                startStationId={game.startStation?.id}
                onUndo={handleUndo}
                onClear={handleClear}
                onSubmit={handleSubmit}
                submitted={submitted}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

}

export default PlanningPage;
