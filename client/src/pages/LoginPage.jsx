import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth.js';
import LoginForm from '../components/LoginForm.jsx';

function LoginPage() {
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const onLogin = async (credentials) => {
    await handleLogin(credentials);
    navigate('/setup');
  };

  return (
    <div className="page-bg login-bg">
      <div className="row justify-content-center mt-5">
        <div className="col-md-5">
          <LoginForm onLogin={onLogin} />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
