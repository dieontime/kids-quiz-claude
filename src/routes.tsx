import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SignupWizard } from './features/auth/SignupWizard.tsx';
import { LoginScreen } from './features/auth/LoginScreen.tsx';
import { RecoveryScreen } from './features/auth/RecoveryScreen.tsx';
import { ThemedDashboard } from './features/dashboard/ThemedDashboard.tsx';
import { ModuleSelectionScreen } from './features/modules/ModuleSelectionScreen.tsx';
import { QuickStartIntro } from './features/quiz/QuickStartIntro.tsx';
import { QuizScreen } from './features/quiz/QuizScreen.tsx';
import { ReviewQuizScreen } from './features/quiz/ReviewQuizScreen.tsx';
import { ResultsScreen } from './features/results/ResultsScreen.tsx';
import { ReviewResultsScreen } from './features/results/ReviewResultsScreen.tsx';
import { useProfileStore } from './stores/profileStore.ts';

function Index() {
  const token = useProfileStore(s => s.token);
  return <Navigate to={token ? '/dashboard' : '/login'} replace />;
}

export const router = createBrowserRouter([
  { path: '/',               Component: Index },
  { path: '/login',          Component: LoginScreen },
  { path: '/signup',         Component: SignupWizard },
  { path: '/recovery',       Component: RecoveryScreen },
  { path: '/dashboard',      Component: ThemedDashboard },
  { path: '/modules',        Component: ModuleSelectionScreen },
  { path: '/quick-start',    Component: QuickStartIntro },
  { path: '/quiz/review',    Component: ReviewQuizScreen },
  { path: '/quiz/:moduleId', Component: QuizScreen },
  { path: '/results',        Component: ResultsScreen },
  { path: '/review-results', Component: ReviewResultsScreen },
]);
