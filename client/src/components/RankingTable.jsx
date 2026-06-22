import { Table, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/useAuth.js';

function RankingTable({ scores = [] }) {
  const { user } = useAuth();

  return (
    <Table striped bordered hover>
      <thead className="table-dark">
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Best Score</th>
        </tr>
      </thead>
      <tbody>
        {scores.length === 0 ? (
          <tr><td colSpan={3} className="text-center text-muted">No scores yet.</td></tr>
        ) : (
          scores.map((s, idx) => (
            <tr key={s.username} className={s.username === user?.username ? 'table-warning' : ''}>
              <td>{idx + 1}</td>
              <td>
                {s.display_name}
                {s.username === user?.username && <Badge bg="warning" text="dark" className="ms-2">You</Badge>}
              </td>
              <td className="fw-bold">{s.best_score} coins</td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}

export default RankingTable;
