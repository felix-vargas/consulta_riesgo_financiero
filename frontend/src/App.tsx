import '@mantine/core/styles.css';
import AuthProvider from '@/components/auth/AuthProvider';
import LoginView from '@/components/LoginView';
import ScoreConsultationView from '@/components/ScoreConsultationView';
import Shell from '@/components/Shell';
import { AuthContext } from '@/context/AuthContext';
import { MantineProvider } from '@mantine/core';
import { useContext } from 'react';
import { theme } from './theme';

function MainContent() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Shell>
      {isAuthenticated ? <ScoreConsultationView /> : <LoginView />}
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MantineProvider theme={theme} defaultColorScheme='light'>
        <MainContent />
      </MantineProvider>
    </AuthProvider>
  );
}
