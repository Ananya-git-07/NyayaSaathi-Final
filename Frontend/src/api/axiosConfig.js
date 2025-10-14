import axios from 'axios';
import toast from 'react-hot-toast';

// The baseURL MUST include '/api' to correctly route all requests.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is still useful for handling cookies if needed.
});

// Define public routes that should NOT trigger a logout on a 401 error.
const PUBLIC_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/kiosks' // Fetching kiosks for registration is a public action.
];

/**
 * Sets up Axios interceptors for global authentication and error handling.
 * @param {function} logout - The logout function from AuthContext.
 */
export const setupInterceptors = (logout) => {
  
  // Request Interceptor: Attaches the token to outgoing requests.
  apiClient.interceptors.request.use(
    (config) => {
      // Retrieve the token from localStorage on each request.
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: Handles global errors, especially auth errors.
  apiClient.interceptors.response.use(
    (response) => response, // Pass through successful responses.
    (error) => {
      const { config, response } = error;
      
      // Check if the error is a 401 (Unauthorized).
      if (response && response.status === 401) {
        
        // Check if the failed request URL is a public route.
        const isPublicRoute = PUBLIC_ROUTES.some(route => config.url.endsWith(route));

        // If it was a public route (like a failed login), do NOT logout.
        // We simply let the error continue to the component's catch block.
        if (isPublicRoute) {
            return Promise.reject(error);
        }

        // If the 401 happened on a PROTECTED route, the session is invalid.
        // It is now safe to call the logout function.
        if (logout) {
          logout();
          toast.error("Your session has expired. Please log in again.");
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export default apiClient;