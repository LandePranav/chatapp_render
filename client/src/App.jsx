import axios from 'axios' ;
import UserContextProvider from "./components/userContext";
import Routes from "./components/routes";

// axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL ;
// axios.defaults.baseURL = "https://dev.eikaze.online/api"
// axios.defaults.baseURL = "https://chatapp-aws-render-final.onrender.com/api"
// axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL ;
axios.defaults.baseURL = "http://localhost:4040/api";
axios.defaults.withCredentials = true ;

export default function App() {

  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  );
}

