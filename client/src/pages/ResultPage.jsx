import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert } from 'react-bootstrap';
import * as API from '../API.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

function ResultPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.getGame(gameId)
      .then(g => {
        if (g.phase !== 'result') {
          // Redirect if not in result phase
          if (g.phase === 'execution') navigate(`/execution/${gameId}`, { replace: true });
          else navigate(`/planning/${gameId}`, { replace: true });
          return;
        }
        setGame(g);
      })
      .catch(err => setError(err.message || 'Failed to load game.'))
      .finally(() => setLoading(false));
  }, [gameId, navigate]);

  if (loading) return <LoadingSpinner text="Loading results…" />;
  if (!game) return <ErrorAlert error={error || 'Game not found.'} />;

  const isValid = game.routeIsValid;
  const score = game.finalScore;
  const invalidReason = game.invalidReason;

  return (
    <div className="page-bg home-bg">
    <div className="row justify-content-center pt-3">
      <div className="col-md-6">
        <Card className="shadow-sm text-center">
          <Card.Header className={isValid ? 'bg-success text-white' : 'bg-danger text-white'}>
            <h4 className="mb-0">
              <i className={`bi ${isValid ? 'bi-trophy' : 'bi-x-octagon'} me-2`}></i>
              {isValid ? 'Game Complete!' : 'Invalid Route'}
            </h4>
          </Card.Header>
          <Card.Body className="py-4">
            <p className="mb-2">
              <strong>{game.startStation?.name}</strong>
              <i className="bi bi-arrow-right mx-2"></i>
              <strong>{game.destinationStation?.name}</strong>
            </p>

            {isValid ? (
              <>
                <h1 className="display-4 fw-bold text-success">{score}</h1>
                <p className="text-muted">coins remaining</p>
              </>
            ) : (
              <Alert variant="warning" className="text-start">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Your route was <strong>invalid or incomplete</strong>. You lose all your coins.
                {invalidReason && (
                  <div className="mt-2 small">
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Reason:</strong> {invalidReason}
                  </div>
                )}
                <div className="mt-2"><strong>Final Score: 0</strong></div>
              </Alert>
            )}

            <div className="d-flex gap-2 justify-content-center mt-3">
              <Button variant="primary" onClick={() => navigate('/setup')}>
                <i className="bi bi-arrow-clockwise me-1"></i>Play Again
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/ranking')}>
                <i className="bi bi-bar-chart me-1"></i>View Ranking
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
    </div>
  );
}

export default ResultPage;
