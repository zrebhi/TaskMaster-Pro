import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const { identifier, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Determine if the identifier is likely an email or username
      const isEmail = identifier.includes('@');

      const loginPayload = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      const response = await axios.post('/api/auth/login', loginPayload);

      const data = response.data; // Axios puts response data in .data

      // Axios throws for non-2xx, so no need for !response.ok check here

      // Login successful, store the token and user data
      // Ideally, store tokens as HttpOnly cookies set by the server
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      // Update auth state for Context
      if (auth && auth.login) {
        auth.login(data.token, data.user);
      }

      // Redirect to dashboard
      navigate('/dashboard');
      toast.success('Login successful!');
    } catch (err) {
      // Axios errors have a response property with status and data
      setError(
        err.response?.data?.message ||
          err.message ||
          'Login failed. Please check your credentials.',
      );
      console.error('Login error:', err);
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
