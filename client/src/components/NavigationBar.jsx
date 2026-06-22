import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth.js';

function NavigationBar() {
  const { user, loggedIn, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <img src="/logo.png" height="30" alt="Last Race" style={{ borderRadius: 4 }} />
          <span className="fw-semibold">Last Race</span>
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="me-auto">
            {loggedIn && (
              <>
                <Nav.Link as={Link} to="/setup">
                  <i className="bi bi-play-fill me-1"></i>Play
                </Nav.Link>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '8px 4px' }} />
                <Nav.Link as={Link} to="/ranking">
                  <i className="bi bi-bar-chart-fill me-1"></i>Ranking
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {loggedIn && (
              <>
                <Navbar.Text className="me-3">
                  <i className="bi bi-person-circle me-1"></i>{user?.display_name}
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={onLogout}>Logout</Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
