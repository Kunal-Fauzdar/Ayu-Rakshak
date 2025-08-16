import logo from './logo.svg';
import './App.css';
import {BrowserRouter as Router , Route , Routes} from 'react-router-dom';
import LandingPage from './pages/landing';
import LoginPage from './pages/LoginPage';
import PatientPage from './pages/PatientPage';
import DoctorPage from './pages/DoctorPage';
function App() {
  return (
    <Router>
      <Routes>
          {/* <Route path="/" /> */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient" element={<PatientPage />} />
          <Route path="/doctor" element={<DoctorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
