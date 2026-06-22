import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import * as API from '../API.js';
import MetroMap from '../components/MetroMap.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

function SetupPage() {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.getSetupData()
      .then(data => setNetwork(data))
      .catch(err => setError(err.message || 'Failed to load network.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const game = await API.createGame();
      navigate(`/planning/${game.gameId}`);
    } catch (err) {
      setError(err.message || 'Failed to start game.');
      setStarting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading metro network…" />;

  return (
    <div className="page-bg home-bg">
    <Row className="g-3 pt-3">
      {/* Map – left */}
      <Col lg={8} md={7}>
        <Card className="shadow-sm">
          <Card.Header className="bg-dark text-white py-2">
            <i className="bi bi-map me-2"></i><strong>Metro Network</strong>
          </Card.Header>
          <Card.Body className="p-2">
            <ErrorAlert error={error} onClose={() => setError('')} />
            {network && (
              <MetroMap
                stations={network.stations}
                segments={network.segments}
                lines={network.lines}
                lineStations={network.lineStations}
                showLines={true}
              />
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* Controls – right */}
      <Col lg={4} md={5}>
        <Card className="shadow-sm mb-3">
          <Card.Header className="bg-success text-white py-2">
            <i className="bi bi-play-circle me-2"></i><strong>Ready to Race?</strong>
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-3">
              Study the map carefully. Lines and colors disappear during planning —
              you must mentally reconstruct the network from the segment list.
            </p>
            <div className="d-grid">
              <Button
                variant="success"
                size="lg"
                onClick={handleStart}
                disabled={starting || !network}
              >
                {starting
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Starting…</>
                  : <><i className="bi bi-play-fill me-2"></i>Start Planning</>}
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Quick rules */}
        <Card className="shadow-sm">
          <Card.Header className="py-2 bg-light">
            <i className="bi bi-info-circle me-2"></i><strong>Quick Rules</strong>
          </Card.Header>
          <Card.Body className="py-2">
            <ul className="small text-muted mb-0 ps-3">
              <li>Lines visible <strong>now only</strong> — vanish during planning</li>
              <li>Start &amp; destination assigned randomly, ≥3 stops apart</li>
              <li>90 seconds to build your route</li>
              <li>Segments must connect in order from start</li>
              <li>No segment can be used twice</li>
              <li>Line changes only at interchange stations</li>
              <li>Start with <Badge bg="warning" text="dark">20 coins</Badge></li>
              <li>Each segment triggers a random event (−4 to +4 coins)</li>
              <li>Invalid or incomplete route skips execution — score 0</li>
              <li>Negative final score stored and shown as 0</li>
              <li>Only your personal best counts on the leaderboard</li>
            </ul>
          </Card.Body>
        </Card>
      </Col>
    </Row>
    </div>
  );
}

export default SetupPage;
