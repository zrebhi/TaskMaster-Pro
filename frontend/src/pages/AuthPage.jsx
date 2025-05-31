import { useLocation, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/Auth/RegisterForm.jsx';
import LoginForm from '../components/Auth/LoginForm.jsx';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which form to show based on the current path
  const isLoginView = location.pathname === '/auth/login' || location.pathname === '/auth'; // Default to login for /auth

  const toggleView = () => {
    if (isLoginView) {
      navigate('/auth/register');
    } else {
      navigate('/auth/login');
    }
  };

  return (
    <div>
      <h1>TaskMaster Pro</h1>
      {isLoginView ? <LoginForm /> : <RegisterForm />}
      <button onClick={toggleView}>
        Switch to {isLoginView ? 'Register' : 'Login'}
      </button>
    </div>
  );
};

export default AuthPage;
