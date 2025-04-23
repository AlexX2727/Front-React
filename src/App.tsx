
import './App.css'

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<LoginPage />} />
                <Route path="/dashboard" element={<h2>Bienvenido al Dashboard</h2>} />
                <Route path="/register" element={<RegisterPage />} />


        {/* Aquí luego agregamos otras páginas */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;