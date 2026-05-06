import { createBrowserRouter } from 'react-router-dom';
import { SignupWizard } from './features/auth/SignupWizard.tsx';
import { LoginScreen } from './features/auth/LoginScreen.tsx';
import { RecoveryScreen } from './features/auth/RecoveryScreen.tsx';

const placeholder = (label: string) => () =>
  <div className="min-h-screen flex items-center justify-center text-2xl text-primary">
    {label}
  </div>;

export const router = createBrowserRouter([
  { path: '/',          Component: placeholder('Home (route placeholder)') },
  { path: '/login',     Component: LoginScreen },
  { path: '/signup',    Component: SignupWizard },
  { path: '/recovery',  Component: RecoveryScreen },
  { path: '/dashboard', Component: placeholder('Dashboard') },
  { path: '/modules',   Component: placeholder('Module Selection') },
  { path: '/quiz/:moduleId', Component: placeholder('Quiz') },
  { path: '/results',   Component: placeholder('Results') },
]);
