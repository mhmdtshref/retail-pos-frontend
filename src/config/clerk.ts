export const clerkConfig = {
  publishableKey: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY as string,
  appearance: {
    layout: {
      socialButtonsVariant: 'iconButton' as const,
      logoPlacement: 'inside' as const,
      logoImageUrl: '/logo.png',
      showOptionalFields: true,
    },
    variables: {
      colorPrimary: '#1976d2',
      colorText: '#333333',
      colorBackground: '#ffffff',
      colorInputBackground: '#f5f5f5',
      colorInputText: '#333333',
    },
  },
  signInUrl: 'https://accounts.clerk.dev/sign-in',
  signUpUrl: 'https://accounts.clerk.dev/sign-up',
}; 