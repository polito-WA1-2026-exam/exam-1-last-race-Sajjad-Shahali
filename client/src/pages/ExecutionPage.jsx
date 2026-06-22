import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Alert } from 'react-bootstrap';
import * as API from '../API.js';
import EventStep from '../components/EventStep.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

function ExecutionPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [steps, setSteps] = useState([]);
  const [done, setDone] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentCoins, setCurrentCoins] = useState(20);

  useEffect(() => {
    API.getGame(gameId)
      .then(g => {
        if (g.phase === 'result') { navigate(`/result/${gameId}`, { replace: true }); return; }
        if (g.phase !== 'execution') { navigate(`/planning/${gameId}`, { replace: true }); return; }
        setGame(g);
        setCurrentCoins(g.coins);

        if (g.events && g.events.length > 0) {
          const stationMap = {};
          for (const s of g.stations) stationMap[s.id] = s;
          const restored = g.events.map(ev => ({
            position: ev.position,
            segmentId: ev.segment_id,
            stationFrom: stationMap[ev.station_from_id],
            stationTo: stationMap[ev.station_to_id],
            event: { description: ev.description, coin_effect: ev.effect },
            coinsAfter: ev.coins_after,
          }));
          setSteps(restored);
        }
      })
      .catch(err => setError(err.message || 'Failed to load game.'))
      .finally(() => setLoading(false));
  }, [gameId, navigate]);

  // Auto-play: reveal each step with 500ms gap. Each invocation owns its own cancelled flag — StrictMode safe.
  useEffect(() => {
    if (!game) return;
    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        await new Promise(r => setTimeout(r, 500));
        if (cancelled) break;
        let result;
        try {
          result = await API.nextExecution(gameId);
        } catch (err) {
          if (!cancelled) setError(err.message || 'Failed to reveal next step.');
          break;
        }
        if (cancelled) break;
        setSteps(prev => [...prev, result]);
        setCurrentCoins(result.coinsAfter);
        if (result.done) {
          setDone(true);
          setFinalScore(result.finalScore);
          break;
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [game, gameId]);

  if (loading) return <LoadingSpinner text="Loading execution phase…" />;
  if (!game) return <ErrorAlert error={error || 'Game not found.'} />;

  const totalSegments = game.routeSegmentIds?.length || 0;
  const stepsRevealed = steps.length;

  return (
    <div className="page-bg home-bg">
    <div className="row justify-content-center pt-3">
      <div className="col-md-8">
        <Card className="shadow-sm mb-3">
          <Card.Header className="bg-info text-white d-flex justify-content-between">
            <span>
              <i className="bi bi-play-circle me-2"></i>
              <strong>Execution Phase</strong>
            </span>
            <span>
              <i className="bi bi-coin me-1"></i>
              <Badge bg="light" text="dark" className="fs-6">{currentCoins} coins</Badge>
            </span>
          </Card.Header>
          <Card.Body>
            <p className="mb-2">
              <strong>Route:</strong> {game.startStation?.name}
              <i className="bi bi-arrow-right mx-2"></i>
              {game.destinationStation?.name}
            </p>
            <p className="text-muted small">Step {stepsRevealed} / {totalSegments}</p>

            <ErrorAlert error={error} onClose={() => setError('')} />

            {steps.map((step, idx) => (
              <EventStep key={step.position ?? idx} step={step} position={idx + 1} />
            ))}

            {!done ? (
              <div className="mt-3 d-flex align-items-center gap-2 text-muted small">
                <span className="spinner-border spinner-border-sm"></span>
                Revealing next segment…
              </div>
            ) : (
              <Alert variant="success" className="mt-3">
                <h5><i className="bi bi-trophy me-2"></i>Journey Complete!</h5>
                <p className="mb-1">Final Score: <strong>{finalScore} coins</strong></p>
                <Button variant="success" onClick={() => navigate(`/result/${gameId}`)}>
                  View Results
                </Button>
              </Alert>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
    </div>
  );
}

export default ExecutionPage;
