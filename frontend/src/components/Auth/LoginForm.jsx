import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext.jsx'; // Adjust path if needed
import { useError } from '../../context/ErrorContext'; // Adjust path if needed
import { loginUser } from '../../services/authApiService'; // Adjust path if needed
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ className, ...props }) {
  // --- All of your existing state and logic is preserved ---
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
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const isEmail = normalizedIdentifier.includes('@');
      const loginPayload = isEmail
        ? { email: normalizedIdentifier, password }
        : { username: normalizedIdentifier, password };

      const data = await loginUser(loginPayload);

      if (auth && auth.login) {
        auth.login(data.token, data.user);
      }

      showSuccess('Login successful!');
      navigate('/dashboard');
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

  // --- The JSX now uses the shadcn Card structure ---
  return (
    <Card className={cn('w-full max-w-sm', className)} {...props}>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email or username below to login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-6">
            {/* Your existing error message display, now styled within the card */}
            {error ? (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            ) : null}
            <div className="grid gap-3">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                name="identifier" // Connects to your onChange handler
                type="text" // Allows both email and username
                placeholder="m@example.com or your_username"
                value={identifier} // Controlled component
                onChange={onChange} // State handler
                required
                disabled={isLoading} // Disable input when loading
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password" // Connects to your onChange handler
                type="password"
                value={password} // Controlled component
                onChange={onChange} // State handler
                required
                disabled={isLoading} // Disable input when loading
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {/* Dynamic button text based on loading state */}
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
