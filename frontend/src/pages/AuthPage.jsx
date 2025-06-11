import { useLocation, Link } from 'react-router-dom';
import RegisterForm from '../components/Auth/RegisterForm.jsx';
import LoginForm from '../components/Auth/LoginForm.jsx';

/**
 * AuthPage - Page-level component responsible for:
 * - A focused, single-column layout that highlights the brand logo.
 * - Route-based form selection (login vs register).
 *
 * This layout is clean, modern, and fully responsive by default.
 */
const AuthPage = () => {
  const location = useLocation();

  const isLoginView =
    location.pathname === '/auth/login' || location.pathname === '/auth';

  return (
    <div
      id="pageContainer"
      className="flex-1 flex flex-col items-center p-5"
    >
      {/* <div id="logoContainer" className="flex justify-center">
        <img src={logoImage} alt="TaskMaster Pro Logo" className="max-w-1/3" />
      </div> */}
      <div id="formsContainer" className="min-w-md flex flex-col space-y-5">
        {/* 2. The Form and Headings */}
        <div className="flex flex-col justify-center items-center">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-foreground">
            {isLoginView ? 'Welcome Back!' : 'Create an Account'}
          </h2>

          {isLoginView ? <LoginForm /> : <RegisterForm />}
        </div>

        {/* 3. The Navigation Link */}
        <div className="text-center text-sm">
          {isLoginView ? (
            <>
              Don{'\''}t have an account?{' '}
              <Link
                to="/auth/register"
                className="font-medium text-primary hover:text-primary/90 underline underline-offset-4"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="font-medium text-primary hover:text-primary/90 underline underline-offset-4"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
