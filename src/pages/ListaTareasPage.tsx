import React, { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import './ListaTareasPage.css';

// Importar servicios API y tipos existentes
import { 
  getProjectsByOwner, 
  Project,
  Task,
  User,
  getTasksWithFilters,  // Nuevo servicio
  getTaskProjectMembers  // Nuevo servicio
} from '../api/services';

// Importar el modal de detalle de tarea
import TaskDetailModal from '../components/TaskDetailModal';

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
  
  // Estados para usuarios y asignados
  const [users, setUsers] = useState<User[]>([]);
  
  // Estados de carga y mensajes
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el modal de detalle de tarea
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // Cargar usuarios para asignación
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        // Intentar cargar los usuarios desde la API
        const response = await api.get('/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsers(response.data);
      } catch (err) {
        console.error('Error al cargar usuarios de API:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, [isAuthenticated]);

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
        
        // Opciones de filtrado
        const filterOptions: {
          projectId?: number;
          assigneeId?: number;
          myTasks?: boolean;
          userId?: number;
          status?: string;
          priority?: string;
        } = {};
        
        // Configurar opciones de filtrado según el filtro seleccionado
        if (filtro === 'misTareas') {
          filterOptions.myTasks = true;
          filterOptions.userId = user.id;
        } 
        else if (filtro === 'porProyecto' && selectedProject) {
          filterOptions.projectId = selectedProject;
        }
        
        // Usar el nuevo servicio para obtener tareas filtradas
        const tasksData = await getTasksWithFilters(filterOptions);
        
        // Asegurarnos de que no hay duplicados en las tareas
        const uniqueTasks = removeDuplicates(tasksData, 'id');
        setTasks(uniqueTasks);
      } catch (err) {
        console.error('Error al cargar tareas:', err);
        setError('Error al cargar las tareas. Por favor, intente de nuevo.');
        
        // Si es error de autenticación, manejar según tus interceptores
        if ((err as any)?.response?.status === 401) {
          navigate('/');
        }
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTareas();
  }, [filtro, selectedProject, isAuthenticated, user?.id, navigate]);

  // Añadir esta función para cargar miembros de proyecto cuando se selecciona un proyecto
  useEffect(() => {
    if (!isAuthenticated || !selectedProject) return;
    
    const fetchProjectMembers = async () => {
      try {
        setLoadingUsers(true);
        
        // Obtener miembros del proyecto usando el nuevo endpoint
        const members = await getTaskProjectMembers(selectedProject);
        
        // Actualizar la lista de usuarios con los miembros del proyecto
        setUsers(members);
      } catch (err) {
        console.error('Error al cargar miembros del proyecto:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchProjectMembers();
  }, [selectedProject, isAuthenticated]);

  // Función para eliminar duplicados de un array basado en una propiedad
  const removeDuplicates = <T extends { [key: string]: any }>(array: T[], property: string): T[] => {
    const uniqueMap = new Map();
    
    array.forEach(item => {
      if (!uniqueMap.has(item[property])) {
        uniqueMap.set(item[property], item);
      }
    });
    
    return Array.from(uniqueMap.values());
  };

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

  // Función para ordenar tareas
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Si ya estamos ordenando por este campo, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un nuevo campo, ordenar ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para abrir el modal de detalle de tarea
  const openTaskDetailModal = (taskId: number) => {
    setSelectedTaskId(taskId);
    setShowTaskModal(true);
  };

  // Función para cerrar el modal de detalle de tarea
  const closeTaskDetailModal = () => {
    setShowTaskModal(false);
    setSelectedTaskId(null);
  };

  // Función para manejar actualización exitosa de tarea
  const handleTaskUpdateSuccess = () => {
    // Recargar la lista de tareas
    const fetchTareasAgain = async () => {
      try {
        // Opciones de filtrado
        const filterOptions: {
          projectId?: number;
          assigneeId?: number;
          myTasks?: boolean;
          status?: string;
          priority?: string;
        } = {};
        
        // Configurar opciones de filtrado según el filtro seleccionado
        if (filtro === 'misTareas') {
          filterOptions.myTasks = true;
          filterOptions.userId = user?.id;
        } 
        else if (filtro === 'porProyecto' && selectedProject) {
          filterOptions.projectId = selectedProject;
        }
        
        // Usar el nuevo servicio
        const tasksData = await getTasksWithFilters(filterOptions);
        
        const uniqueTasks = removeDuplicates(tasksData, 'id');
        setTasks(uniqueTasks);
      } catch (err) {
        console.error('Error al recargar tareas:', err);
      }
    };
    
    fetchTareasAgain();
  };

  // Ordenar tareas
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortField === 'title') {
      return sortDirection === 'asc' 
        ? (a.title || '').localeCompare(b.title || '') 
        : (b.title || '').localeCompare(a.title || '');
    } else if (sortField === 'status') {
      return sortDirection === 'asc' 
        ? (a.status || '').localeCompare(b.status || '') 
        : (b.status || '').localeCompare(a.status || '');
    } else if (sortField === 'priority') {
      const priorityOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      return sortDirection === 'asc' ? aPriority - bPriority : bPriority - aPriority;
    } else if (sortField === 'dueDate') {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }
    return 0;
  });

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
      case 'Todo': 
      case 'To Do': return 'estado-pendiente';
      case 'In Progress': return 'estado-progreso';
      case 'Review': return 'estado-revision';
      case 'Done': 
      case 'Completado': return 'estado-completado';
      case 'Blocked': return 'estado-bloqueado';
      default: return 'estado-pendiente'; // Default para valores desconocidos
    }
  };

  // Función para obtener texto según estado
  const getEstadoTexto = (estado?: string): string => {
    switch (estado) {
      case 'Todo': 
      case 'To Do': return 'Por Hacer';
      case 'In Progress': return 'En Progreso';
      case 'Review': return 'En Revisión';
      case 'Done': return 'Completado';
      case 'Blocked': return 'Bloqueado';
      case 'Desconocido': return 'Desconocido';
      default: return estado || 'Desconocido';
    }
  };

  // Función para obtener el texto de prioridad
  const getPrioridadTexto = (prioridad?: string): string => {
    switch (prioridad) {
      case 'Low': return 'Baja';
      case 'Medium': return 'Media';
      case 'High': return 'Alta';
      case 'Critical': return 'Crítica';
      default: return 'No definida';
    }
  };

  // Función para obtener el nombre del usuario asignado
  const getAssigneeName = (assigneeId?: number): string => {
    if (!assigneeId) return 'Sin asignar';
    if (assigneeId === user?.id) return 'Tú';
    
    // Buscar en la lista de usuarios
    const assignee = users.find(u => u.id === assigneeId);
    if (assignee) {
      if (assignee.username) return assignee.username;
      if (assignee.firstName && assignee.lastName) return `${assignee.firstName} ${assignee.lastName}`;
      return assignee.firstName || assignee.lastName || `Usuario #${assigneeId}`;
    }
    
    return `Usuario ID: ${assigneeId}`;
  };

  return (
    <div className="lista-tareas-container">
      <div className="lista-tareas-header">
        <h1>Gestión de Tareas</h1>
        <button className="btn-crear-tarea" onClick={() => navigate('/tareas')}>
          Crear Nueva Tarea
        </button>
      </div>
      
      {/* Sistema de filtrado */}
      <div className="filtros-container">
        <div className="filtro-grupo">
          <label htmlFor="filtroTipoTareas">Filtrar por:</label>
          <select
            id="filtroTipoTareas"
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
            <label htmlFor="filtroProyecto">Proyecto:</label>
            <select
              id="filtroProyecto"
              value={selectedProject || ''}
              onChange={handleProyectoChange}
            >
              <option value="">Seleccionar proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mensaje de error si existe */}
      {error && (
        <div className="mensaje-error">
          {error}
          <button 
            className="close-button" 
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Spinner de carga */}
      {loadingTasks && (
        <div className="mensaje-cargando">
          <div className="spinner"></div>
          <span>Cargando tareas...</span>
        </div>
      )}

      {/* Lista de tareas */}
      {!loadingTasks && sortedTasks.length > 0 ? (
        <div className="task-list">
          <h3 className="section-title">
            {filtro === 'porProyecto' && selectedProject 
              ? `Tareas del proyecto: ${projects.find(p => p.id === selectedProject)?.name || 'Seleccionado'}`
              : filtro === 'misTareas' 
                ? 'Mis Tareas Asignadas' 
                : 'Todas las Tareas'
            }
          </h3>
          
          {/* Vista única según el tamaño de pantalla - controlada por CSS */}
          <div className="tabla-tareas-container">
            <table className="tabla-tareas">
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')} className="sortable-header">
                    Título {sortField === 'title' && (
                      <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('status')} className="sortable-header">
                    Estado {sortField === 'status' && (
                      <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('priority')} className="sortable-header">
                    Prioridad {sortField === 'priority' && (
                      <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('dueDate')} className="sortable-header">
                    Fecha límite {sortField === 'dueDate' && (
                      <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th>Asignado a</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => (
                  <tr key={task.id} onClick={() => openTaskDetailModal(task.id)}>
                    <td data-label="Título">{task.title}</td>
                    <td data-label="Estado">
                      <span className={`estado-badge ${getEstadoClass(task.status)}`}>
                        {getEstadoTexto(task.status)}
                      </span>
                    </td>
                    <td data-label="Prioridad">
                      <span className={`prioridad-badge ${getPrioridadClass(task.priority)}`}>
                        {getPrioridadTexto(task.priority)}
                      </span>
                    </td>
                    <td data-label="Fecha límite">{formatearFecha(task.dueDate)}</td>
                    <td data-label="Asignado a">
                      {task.assignee_id ? (
                        <div className="usuario-asignado">
                          {getAssigneeName(task.assignee_id)}
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
                          openTaskDetailModal(task.id);
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
        </div>
      ) : !loadingTasks ? (
        <div className="mensaje-sin-tareas">
          <p>No hay tareas disponibles con los filtros seleccionados.</p>
          {filtro === 'porProyecto' && !selectedProject && (
            <p>Por favor, selecciona un proyecto para ver sus tareas.</p>
          )}
        </div>
      ) : null}
      
      {/* Modal de detalle de tarea */}
      <TaskDetailModal
        isOpen={showTaskModal}
        onClose={closeTaskDetailModal}
        taskId={selectedTaskId}
        onEditSuccess={handleTaskUpdateSuccess}
        projectMembers={users} // Pasamos la lista de usuarios cargada
      />
    </div>
  );
};

export default ListaTareasPage;