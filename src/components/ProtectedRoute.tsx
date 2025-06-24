import React from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      clerk.openSignIn();
    }
  }, [isLoaded, isSignedIn, clerk]);

  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 