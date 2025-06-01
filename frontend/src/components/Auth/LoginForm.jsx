import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext.jsx';
import { useError } from '../../context/ErrorContext';
import { loginUser } from '../../services/authApiService';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { showErrorToast, showSuccess } = useError();

  const { identifier, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const isEmail = identifier.includes('@');
      const loginPayload = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      const data = await loginUser(loginPayload);

      // Update auth state for Context
      if (auth && auth.login) {
        auth.login(data.token, data.user);
      }

      navigate('/dashboard');
      showSuccess('Login successful!');
    } catch (err) {
      if (err.processedError) {
        showErrorToast(err.processedError);
        setError(err.processedError.message);
      } else {
        const fallbackMessage = 'Login failed. Please check your credentials.';
        showErrorToast({ message: fallbackMessage, severity: 'medium' });
        setError(fallbackMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>Login</h2>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      <div>
        <label htmlFor="identifier">Email or Username:</label>
        <input
          type="text"
          name="identifier"
          id="identifier"
          value={identifier}
          onChange={onChange}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="login-password">Password:</label>
        <input
          type="password"
          name="password"
          id="login-password"
          value={password}
          onChange={onChange}
          required
          disabled={isLoading}
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
