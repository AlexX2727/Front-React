import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './ListaTareasPage.css';

// Importar servicios API y tipos existentes
import { 
  getProjectsByOwner, 
  Project,
  Task
} from '../api/services';

const ListaTareasPage: React.FC = () => {
  // Obtener usuario del localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const navigate = useNavigate();
  
  // Estado para controlar el usuario autenticado
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Estados para proyectos y tareas
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<string>('todas'); // 'todas', 'misTareas', 'porProyecto'
  
  // Estados de carga y mensajes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar que el usuario esté autenticado
  useEffect(() => {
    try {
      // Verificar si hay un usuario autenticado
      if (!storedUser || !localStorage.getItem('token')) {
        navigate('/');
        return;
      }
      
      // Marcar al usuario como autenticado para activar otros efectos
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      navigate('/');
    }
  }, [navigate, storedUser]);

  // Cargar proyectos del usuario cuando el usuario está autenticado
  useEffect(() => {
    // Verificamos que el usuario esté autenticado y exista un ID
    if (!isAuthenticated || !user?.id) return;
    
    const fetchProyectos = async () => {
      try {
        setLoadingProjects(true);
        const data = await getProjectsByOwner(user.id); // Cargar proyectos del usuario
        setProjects(data);
      } catch (err) {
        console.error('Error al cargar proyectos:', err);
        setError('Error al cargar los proyectos. Por favor, intente de nuevo.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProyectos();
  }, [isAuthenticated, user?.id]);

  // Cargar tareas según el filtro seleccionado
  useEffect(() => {
    // Verificamos que el usuario esté autenticado
    if (!isAuthenticated || !user?.id) return;
    
    const fetchTareas = async () => {
      try {
        setLoadingTasks(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        let response;
        
        if (filtro === 'misTareas') {
          // Cargar tareas asignadas al usuario actual
          response = await api.get(`/tasks/assignee/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } 
        else if (filtro === 'porProyecto' && selectedProject) {
          // Cargar tareas del proyecto seleccionado
          response = await api.get(`/tasks/project/${selectedProject}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        else {
          // Cargar todas las tareas
          response = await api.get('/tasks', {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        setTasks(response.data);
      } catch (err) {
        console.error('Error al cargar tareas:', err);
        setError('Error al cargar las tareas. Por favor, intente de nuevo.');
        
        // Si es error de autenticación, limpiar el localStorage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any)?.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTareas();
  }, [filtro, selectedProject, isAuthenticated, user?.id, navigate]);

  // Manejador para cambio de filtro
  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoFiltro = e.target.value;
    setFiltro(nuevoFiltro);
    
    // Si cambiamos a un filtro que no es por proyecto, resetear el proyecto seleccionado
    if (nuevoFiltro !== 'porProyecto') {
      setSelectedProject(null);
    }
  };

  // Manejador para cambio de proyecto
  const handleProyectoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedProject(projectId);
  };

  // Función para formatear fechas
  const formatearFecha = (fechaStr?: string): string => {
    if (!fechaStr) return 'No definida';
    
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para obtener clase CSS según prioridad
  const getPrioridadClass = (prioridad?: string): string => {
    switch (prioridad) {
      case 'Low': return 'prioridad-baja';
      case 'Medium': return 'prioridad-media';
      case 'High': return 'prioridad-alta';
      case 'Critical': return 'prioridad-critica';
      default: return '';
    }
  };

  // Función para obtener clase CSS según estado
  const getEstadoClass = (estado?: string): string => {
    switch (estado) {
      case 'Todo': return 'estado-pendiente';
      case 'In Progress': return 'estado-progreso';
      case 'Review': return 'estado-revision';
      case 'Done': return 'estado-completado';
      case 'Blocked': return 'estado-bloqueado';
      default: return '';
    }
  };

  // Función para obtener texto según estado
  const getEstadoTexto = (estado?: string): string => {
    switch (estado) {
      case 'Todo': return 'Por Hacer';
      case 'In Progress': return 'En Progreso';
      case 'Review': return 'En Revisión';
      case 'Done': return 'Completado';
      case 'Blocked': return 'Bloqueado';
      default: return 'Desconocido';
    }
  };

  // Función para navegar a la página de detalle de tarea
  const verDetalleTarea = (tareaId: number) => {
    navigate(`/tareas/${tareaId}`);
  };



  return (
    <div className="lista-tareas-container">
      <div className="lista-tareas-header">
        <h1>Listado de Tareas</h1>
        <button className="btn-crear-tarea" onClick={() => navigate('/tareas')}>
          Crear Nueva Tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtro-grupo">
          <label htmlFor="filtro">Ver:</label>
          <select 
            id="filtro" 
            value={filtro} 
            onChange={handleFiltroChange}
          >
            <option value="todas">Todas las Tareas</option>
            <option value="misTareas">Mis Tareas</option>
            <option value="porProyecto">Por Proyecto</option>
          </select>
        </div>

        {filtro === 'porProyecto' && (
          <div className="filtro-grupo">
            <label htmlFor="proyecto">Proyecto:</label>
            <select 
              id="proyecto" 
              value={selectedProject || ''} 
              onChange={handleProyectoChange}
            >
              <option value="">Seleccionar proyecto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mensajes de estado */}
      {loadingTasks && <div className="mensaje-cargando">Cargando tareas...</div>}
      {error && <div className="mensaje-error">{error}</div>}

      {/* Tabla de tareas */}
      {!loadingTasks && tasks.length > 0 ? (
        <div className="tabla-tareas-container">
          <table className="tabla-tareas">
            <thead>
              <tr>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Fecha Límite</th>
                <th>Asignado a</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} onClick={() => verDetalleTarea(task.id)}>
                  <td data-label="Título">{task.title}</td>
                  <td data-label="Estado">
                    <span className={`estado-badge ${getEstadoClass(task.status)}`}>
                      {getEstadoTexto(task.status)}
                    </span>
                  </td>
                  <td data-label="Prioridad">
                    <span className={`prioridad-badge ${getPrioridadClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td data-label="Fecha Límite">{formatearFecha(task.dueDate)}</td>
                  <td data-label="Asignado a">
                    {task.assignee ? (
                      <div className="usuario-asignado">
                        <span>
                          {task.assignee.fullName || task.assignee.username}
                        </span>
                      </div>
                    ) : (
                      <span className="sin-asignar">Sin asignar</span>
                    )}
                  </td>
                  <td data-label="Acciones">
                    <button 
                      className="btn-ver-detalle"
                      onClick={(e) => {
                        e.stopPropagation();
                        verDetalleTarea(task.id);
                      }}
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loadingTasks ? (
        <div className="mensaje-sin-tareas">
          No hay tareas disponibles con los filtros seleccionados.
        </div>
      ) : null}
    </div>
  );
};

export default ListaTareasPage;