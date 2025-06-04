import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  getProjectsByOwner, 
  getProjectMembers, 
  createTask, 
  Project, 
  ProjectMember
} from '../api/services';

// Definición mejorada del DTO para garantizar compatibilidad exacta con el backend
interface CreateTaskDto {
  project_id: number;
  title: string;
  description?: string | null;
  status: 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: string | null | undefined;
  assignee_id?: number | null;
  completedAt?: string | null;
}
import './TareasPage.css';

const TareasPage: React.FC = () => {
  // Obtener usuario del localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const navigate = useNavigate();
  
  // Estado para controlar el usuario autenticado
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Estados para proyectos y miembros
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  // Estados de carga y mensajes
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado del formulario
  const [taskForm, setTaskForm] = useState<CreateTaskDto>({
    project_id: 0,
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    dueDate: '',
    estimatedHours: 0,
    assignee_id: undefined // Cambiado de null a undefined
  });

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
  }, [navigate, storedUser]); // Añadidos navigate y storedUser como dependencias

  // Cargar proyectos del usuario cuando el usuario está autenticado
  useEffect(() => {
    // Verificamos que el usuario esté autenticado y exista un ID
    if (!isAuthenticated || !user?.id) return;
    
    const fetchProyectos = async () => {
      try {
        setLoadingProjects(true);
        const data = await getProjectsByOwner(user.id); // Cargar proyectos del usuario
        setProjects(data);
        
        // Solo seleccionamos el primer proyecto si hay proyectos y no hay ninguno seleccionado
        if (data.length > 0 && selectedProject === null) {
          const firstProjectId = data[0].id;
          setSelectedProject(firstProjectId);
          setTaskForm(prev => ({
            ...prev,
            project_id: firstProjectId, // Registrar el ID del proyecto seleccionado
          }));
        }
      } catch (err) {
        console.error('Error al cargar proyectos:', err);
        setError('Error al cargar los proyectos. Por favor, intente de nuevo.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProyectos();
    // Este efecto se ejecuta cuando el usuario está autenticado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Ahora depende de isAuthenticated

  // Cargar miembros cuando se selecciona un proyecto
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (selectedProject) {
        try {
          setLoadingMembers(true);
          const members = await getProjectMembers(selectedProject); // Cargar miembros del proyecto
          setProjectMembers(members);
        } catch (err) {
          console.error('Error al cargar miembros:', err);
        } finally {
          setLoadingMembers(false);
        }
      } else {
        setProjectMembers([]);
      }
    };

    fetchProjectMembers();
  }, [selectedProject]); // Esto está bien porque `selectedProject` es necesario

  // Manejar cambio en la selección de proyecto
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedProject(projectId);
    setTaskForm(prev => ({
      ...prev,
      project_id: projectId || 0, // Registrar el ID del proyecto seleccionado
    }));
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'assignee_id') {
      setTaskForm(prev => ({
        ...prev,
        assignee_id: value === '' ? undefined : Number(value), // Cambiado de null a undefined
      }));
    } else {
      setTaskForm(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    }
  };

  // Validar el formulario
  const validateForm = (): boolean => {
    setError(null);
  
    // Validar que el proyecto está seleccionado
    if (!selectedProject && !taskForm.project_id) {
      setError('Debe seleccionar un proyecto');
      return false;
    }
  
    // Validar que el título esté presente
    if (!taskForm.title?.trim()) {
      setError('El título de la tarea es obligatorio');
      return false;
    }
  
    // Validar que las horas estimadas son válidas
    if (taskForm.estimatedHours !== undefined &&
        (isNaN(Number(taskForm.estimatedHours)) ||
         Number(taskForm.estimatedHours) < 0 ||
         Number(taskForm.estimatedHours) > 1000)) {
      setError('Las horas estimadas deben ser un número entre 0 y 1000');
      return false;
    }
  
    // Validar formato de fecha
    if (taskForm.dueDate && isNaN(Date.parse(taskForm.dueDate))) {
      setError('La fecha límite no es válida');
      return false;
    }
  
    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const projectId = Number(selectedProject || taskForm.project_id);
      if (!projectId || isNaN(projectId)) {
        throw new Error('ID de proyecto inválido');
      }

      const formData: CreateTaskDto = {
        project_id: projectId,
        title: taskForm.title.trim(),
        description: taskForm.description?.trim() || undefined,
        status: taskForm.status,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || undefined,
        estimatedHours: taskForm.estimatedHours || undefined,
        assignee_id: taskForm.assignee_id, // Ya está como undefined si no hay valor
      };

      await createTask(formData);
      setSuccess('¡Tarea creada exitosamente!');
      setTaskForm({
        project_id: projectId,
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        dueDate: '',
        estimatedHours: 0,
        assignee_id: undefined, // Cambiado de null a undefined
      });
    } catch (err) {
      console.error('Error al crear tarea:', err);
      setError('Error al crear la tarea. Por favor, intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);
  // Eliminamos logs para debugging en producción

  return (
    <div className="tareas-container">
      <div className="tareas-header">
        <h1>Gestor de Tareas</h1>
        <p>Crea y administra tus tareas de proyecto</p>
      </div>

      {/* Mensajes de estado */}
      {loadingProjects && <div className="alert alert-info">Cargando proyectos...</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="tareas-content">
        <div className="tareas-form-container">
          <h2>Nueva Tarea</h2>
          
          <form className="tareas-form" onSubmit={handleSubmit}>
            {/* Selector de Proyecto */}
            <div className="form-group">
              <label htmlFor="project">Proyecto:</label>
              <select 
                id="project" 
                value={selectedProject || ''}
                onChange={handleProjectChange}
                required
              >
                <option value="">Seleccione un proyecto</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div className="form-group">
              <label htmlFor="title">Título:</label>
              <input 
                type="text" 
                id="title" 
                name="title"
                value={taskForm.title}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label htmlFor="description">Descripción:</label>
              <textarea 
                id="description" 
                name="description"
                value={taskForm.description || ''}
                onChange={handleFormChange}
                rows={4}
              />
            </div>

            {/* Fila para status y priority */}
            <div className="form-row">
              {/* Estado */}
              <div className="form-group">
                <label htmlFor="status">Estado:</label>
                <select 
                  id="status" 
                  name="status"
                  value={taskForm.status}
                  onChange={handleFormChange}
                >
                  <option value="Todo">Por Hacer</option>
                  <option value="In Progress">En Progreso</option>
                  <option value="Review">En Revisión</option>
                  <option value="Done">Completado</option>
                  <option value="Blocked">Bloqueado</option>
                </select>
              </div>

              {/* Prioridad */}
              <div className="form-group">
                <label htmlFor="priority">Prioridad:</label>
                <select 
                  id="priority" 
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleFormChange}
                >
                  <option value="Low">Baja</option>
                  <option value="Medium">Media</option>
                  <option value="High">Alta</option>
                  <option value="Critical">Crítica</option>
                </select>
              </div>
            </div>

            {/* Fecha límite y Horas estimadas */}
            <div className="form-row">
              {/* Fecha límite */}
              <div className="form-group">
                <label htmlFor="dueDate">Fecha límite:</label>
                <input 
                  type="date" 
                  id="dueDate" 
                  name="dueDate"
                  value={taskForm.dueDate || ''}
                  onChange={handleFormChange}
                />
              </div>

              {/* Horas estimadas */}
              <div className="form-group">
                <label htmlFor="estimatedHours">Horas estimadas:</label>
                <input 
                  type="number" 
                  id="estimatedHours" 
                  name="estimatedHours"
                  min="0"
                  max="1000"
                  value={taskForm.estimatedHours || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            {/* Miembro asignado */}
            <div className="form-group">
              <label htmlFor="assignee_id">Asignar a:</label>
              <select 
                id="assignee_id" 
                name="assignee_id"
                value={taskForm.assignee_id?.toString() || ''}
                onChange={handleFormChange}
              >
                <option value="">Sin asignar</option>
                {loadingMembers ? (
                  <option value="" disabled>Cargando miembros...</option>
                ) : projectMembers && projectMembers.length > 0 ? (
                  projectMembers.map(member => {
                    // Eliminamos los logs excesivos que podrían afectar el rendimiento

                    // Solo renderizar si tenemos los datos necesarios
                    if (!member.user) {
                      return null;
                    }

                    return (
                      <option key={member.id} value={member.user.id}>
                        {member.user.fullName || member.user.username} ({member.role})
                      </option>
                    );
                  }).filter(Boolean)
                ) : (
                  <option value="" disabled>No hay miembros disponibles</option>
                )}
              </select>
            </div>

            {/* Botón de envío */}
            <div className="form-group">
              <button 
                type="submit" 
                className="submit-button"
              >
                {submitting ? 'Creando...' : 'Crear Tarea'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TareasPage;