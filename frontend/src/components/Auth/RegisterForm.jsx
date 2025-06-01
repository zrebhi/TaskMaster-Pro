import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../../context/ErrorContext';
import { registerUser } from '../../services/authApiService';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showErrorToast, showSuccess } = useError();

  const { username, email, password, confirmPassword } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Basic client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setError(
        'Username can only contain letters, numbers, underscores, and hyphens.'
      );
      setIsLoading(false);
      return;
    }

    try {
      const data = await registerUser({ username, email, password });
      const successMsg =
        data.message || 'Registration successful! You can now log in.';
      setSuccessMessage(successMsg);
      showSuccess(successMsg);
      navigate('/auth/login');
    } catch (err) {
      if (err.processedError) {
        showErrorToast(err.processedError);
        setError(err.processedError.message);
      } else {
        const fallbackMessage = 'Registration failed. Please try again.';
        showErrorToast({ message: fallbackMessage, severity: 'medium' });
        setError(fallbackMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>Register</h2>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {successMessage ? (
        <p style={{ color: 'green' }}>{successMessage}</p>
      ) : null}
      <div>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          name="username"
          id="username"
          value={username}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          name="email"
          id="email"
          value={email}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          value={confirmPassword}
          onChange={onChange}
          required
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
