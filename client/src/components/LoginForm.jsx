import { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ErrorAlert from './ErrorAlert.jsx';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) return setError('Username is required.');
    if (!password.trim()) return setError('Password is required.');

    setLoading(true);
    try {
      await onLogin({ username, password });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Card.Body className="p-4">
        <h4 className="mb-3 text-center d-flex align-items-center justify-content-center gap-2">
          <img height="40" alt="Last Race" src="/logo.png" style={{ borderRadius: 8 }} />
          Last Race
        </h4>
        <ErrorAlert error={error} onClose={() => setError('')} />
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </Button>
          <div className="text-center mt-3">
            <Link to="/" className="text-muted small">
              <i className="bi bi-arrow-left me-1"></i>Back to Home
            </Link>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default LoginForm;
