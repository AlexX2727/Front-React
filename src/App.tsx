
import './App.css'

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from './pages/RegisterPage';
import CrearProyectoPage from './pages/CrearProyectosPage';
import PrincipalPage from './pages/PrincipalPage';
import MisProyectosPage from './pages/MisProyectosPage';
import AñadirMiembrosPage from './pages/AñadirMiembrosPage';
import EditarPerfilPage from './pages/EditarPerfilPage';
import PerfilPage from './pages/PerfilPage';
import TareasPage from './pages/TareasPage';
import ListaTareasPage from './pages/ListaTareasPage';
import DetalleTareaPage from './pages/DetalleTareaPage';

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
                <Route path="/perfil" element={<PerfilPage />} />
                <Route path="/tareas" element={<TareasPage />} />
                <Route path="/listartareas" element={<ListaTareasPage />} />
                <Route path="/tareas/:id" element={<DetalleTareaPage />} /> 
       
       
      </Routes>
    </Router>
  );
}

export default App;