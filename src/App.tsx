import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';

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

// Importaciones para Toast notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      </Routes>
      
      {/* Configuración del contenedor de notificaciones Toast */}
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark" // Tema oscuro para que coincida con tu diseño
      />
    </Router>
  );
}

export default App;