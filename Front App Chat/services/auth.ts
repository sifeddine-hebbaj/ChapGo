export const getAuthToken = (): string | null => {
  // Implémentez votre logique pour récupérer le token
  return localStorage.getItem('authToken'); // Ou AsyncStorage pour React Native
};
