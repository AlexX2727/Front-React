
import './App.css'

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from './pages/RegisterPage';
import CrearProyectoPage from './pages/CrearProyectosPage';
import PrincipalPage from './pages/PrincipalPage';
import MisProyectosPage from './pages/MisProyectosPage';
import AñadirMiembrosPage from './pages/AñadirMiembrosPage';
import EditarPerfilPage from './pages/EditarPerfilPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<LoginPage />} />
                <Route path="/dashboard" element={<h2>Bienvenido al Dashboard</h2>} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/crear-proyecto" element={<CrearProyectoPage />} />
                <Route path='/principal' element={<PrincipalPage />} />
                <Route path="/mis-proyectos" element={<MisProyectosPage />} />
                <Route path="/añadir-miembro/:projectId" element={<AñadirMiembrosPage />} />
                <Route path="/editar-perfil" element={<EditarPerfilPage />} />


        {/* Aquí luego agregamos otras páginas */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;