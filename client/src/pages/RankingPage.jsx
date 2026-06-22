import { useEffect, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import * as API from '../API.js';
import RankingTable from '../components/RankingTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

function RankingPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.getRanking()
      .then(data => setScores(data))
      .catch(err => setError(err.message || 'Failed to load ranking.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading ranking…" />;

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <Card className="shadow-sm">
          <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="bi bi-trophy me-2"></i>General Ranking</h5>
            <Button size="sm" variant="outline-light" onClick={() => navigate('/setup')}>
              <i className="bi bi-play me-1"></i>Play
            </Button>
          </Card.Header>
          <Card.Body>
            <ErrorAlert error={error} onClose={() => setError('')} />
            <RankingTable scores={scores} />
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default RankingPage;
