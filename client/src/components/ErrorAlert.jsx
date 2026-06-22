import { Alert } from 'react-bootstrap';

function ErrorAlert({ error, onClose }) {
  if (!error) return null;
  return (
    <Alert variant="danger" dismissible={!!onClose} onClose={onClose}>
      <i className="bi bi-exclamation-triangle me-2"></i>{error}
    </Alert>
  );
}

export default ErrorAlert;
