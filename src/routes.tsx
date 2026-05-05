import { createBrowserRouter } from 'react-router-dom';

const placeholder = (label: string) => () =>
  <div className="min-h-screen flex items-center justify-center text-2xl text-primary">
    {label}
  </div>;

export const router = createBrowserRouter([
  { path: '/',          Component: placeholder('Home (route placeholder)') },
  { path: '/login',     Component: placeholder('Login') },
  { path: '/signup',    Component: placeholder('Signup') },
  { path: '/recovery',  Component: placeholder('Recovery') },
  { path: '/dashboard', Component: placeholder('Dashboard') },
  { path: '/modules',   Component: placeholder('Module Selection') },
  { path: '/quiz/:moduleId', Component: placeholder('Quiz') },
  { path: '/results',   Component: placeholder('Results') },
]);
