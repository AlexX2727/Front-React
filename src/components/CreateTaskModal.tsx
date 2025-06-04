// CreateTaskModal.tsx - VERSIÓN SIN BOOTSTRAP
import React, { useState, useEffect } from 'react';
import { 
  getProjectsByOwner, 
  getProjectMembers, 
  createTask, 
  Project, 
  ProjectMember
} from '../api/services';

interface CreateTaskDto {
  project_id: number;
  title: string;
  description?: string;
  status?: 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  estimatedHours?: number;
  assignee_id?: number;
  actualHours?: number;
  completedAt?: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  preselectedProjectId?: number | null;
  theme?: 'light' | 'dark';
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  preselectedProjectId = null,
  theme = 'dark'
}) => {
  // Obtener usuario del localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id || 0;
  
  // Estados para proyectos y miembros
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(preselectedProjectId);
  
  // Estados de carga y mensajes
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  // Eliminadas variables no utilizadas
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
    estimatedHours: '',
    actualHours: null,
    assignee_id: undefined
  });

  console.log('CreateTaskModal render:', { isOpen, userId });

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !userId) return;
    
    const loadInitialData = async () => {
      try {
        setLoadingProjects(true);
        setError(null);

        // Cargar proyectos del usuario
        const projectsData = await getProjectsByOwner(userId);
        setProjects(projectsData);

        // Si hay un proyecto preseleccionado o solo hay uno, cargar sus miembros
        if (preselectedProjectId) {
          setSelectedProject(preselectedProjectId);
          setTaskForm(prev => ({ ...prev, project_id: preselectedProjectId }));
          await loadProjectMembers(preselectedProjectId);
        } else if (projectsData.length === 1) {
          const firstProjectId = projectsData[0].id;
          setSelectedProject(firstProjectId);
          setTaskForm(prev => ({ ...prev, project_id: firstProjectId }));
          await loadProjectMembers(firstProjectId);
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
        setError('Error al cargar los datos. Por favor, intente de nuevo.');
      } finally {
        setLoadingProjects(false);
      }
    };

    loadInitialData();
  }, [isOpen, userId, preselectedProjectId]);

  // Cargar miembros del proyecto
  const loadProjectMembers = async (projectId: number) => {
    try {
      setLoadingMembers(true);
      const members = await getProjectMembers(projectId);
      setProjectMembers(members);
    } catch (err) {
      console.error('Error al cargar miembros del proyecto:', err);
      setProjectMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Manejar cambio de proyecto
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedProject(projectId);
    setTaskForm(prev => ({
      ...prev,
      project_id: projectId || 0,
      assignee_id: undefined // Resetear asignado cuando cambia el proyecto
    }));

    if (projectId) {
      loadProjectMembers(projectId);
    } else {
      setProjectMembers([]);
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'assignee_id') {
      setTaskForm(prev => ({
        ...prev,
        assignee_id: value === '' ? undefined : Number(value),
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
  
    if (!selectedProject && !taskForm.project_id) {
      setError('Debe seleccionar un proyecto');
      return false;
    }
  
    if (!taskForm.title?.trim()) {
      setError('El título de la tarea es obligatorio');
      return false;
    }
  
    if (taskForm.estimatedHours !== undefined &&
        (isNaN(Number(taskForm.estimatedHours)) ||
         Number(taskForm.estimatedHours) < 0 ||
         Number(taskForm.estimatedHours) > 1000)) {
      setError('Las horas estimadas deben ser un número entre 0 y 1000');
      return false;
    }
  
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
        estimatedHours: taskForm.estimatedHours ? String(taskForm.estimatedHours) : undefined,
        actualHours: taskForm.actualHours ? String(taskForm.actualHours) : null,
        assignee_id: taskForm.assignee_id,
      };

      await createTask(formData);
      setSuccess('¡Tarea creada exitosamente!');
      
      // Resetear formulario
      setTaskForm({
        project_id: projectId,
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        dueDate: '',
        estimatedHours: 0,
        assignee_id: undefined,
      });

      // Notificar éxito y cerrar modal después de un momento
      setTimeout(() => {
        onTaskCreated();
        closeModal();
      }, 1500);
    } catch (err) {
      console.error('Error al crear tarea:', err);
      setError('Error al crear la tarea. Por favor, intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cerrar modal y resetear formulario
  const closeModal = () => {
    setTaskForm({
      project_id: 0,
      title: '',
      description: '',
      status: 'Todo',
      priority: 'Medium',
      dueDate: '',
      estimatedHours: 0,
      assignee_id: undefined,
    });
    setSelectedProject(preselectedProjectId);
    setProjectMembers([]);
    setError(null);
    setSuccess(null);
    onClose();
  };

  // Obtener nombre completo del miembro
  const getMemberDisplayName = (member: ProjectMember): string => {
    if (!member.user) return 'Usuario desconocido';
    
    if (member.user.username) return member.user.username;
    if (member.user.firstName && member.user.lastName) 
      return `${member.user.firstName} ${member.user.lastName}`;
    return member.user.firstName || member.user.lastName || `Usuario #${member.user.id}`;
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

  // Resetear estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setTaskForm({
        project_id: 0,
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        dueDate: '',
        estimatedHours: 0,
        assignee_id: undefined,
      });
      setProjectMembers([]);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  // Si no está abierto, no renderizar nada
  if (!isOpen) {
    return null;
  }

  return (
    <div style={modalOverlayStyles} onClick={closeModal}>
      <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={titleStyles}>
            <span style={{ marginRight: '12px' }}>✏️</span>
            <span>Crear Nueva Tarea</span>
          </div>
          <button 
            onClick={closeModal}
            style={closeButtonStyles}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyles}>
          {/* Loading inicial */}
          {loadingProjects && (
            <div style={loadingStyles}>
              <div style={spinnerStyles}></div>
              <p>Cargando proyectos...</p>
            </div>
          )}
          
          {/* Mensajes de error y éxito */}
          {error && (
            <div style={errorStyles}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={successStyles}>
              {success}
            </div>
          )}

          {/* Formulario */}
          {!loadingProjects && (
            <form onSubmit={handleSubmit}>
              {/* Selector de Proyecto */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Proyecto *</label>
                <select 
                  value={selectedProject || ''}
                  onChange={handleProjectChange}
                  required
                  disabled={loadingProjects || preselectedProjectId !== null}
                  style={selectStyles}
                >
                  <option value="">Seleccione un proyecto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {preselectedProjectId && (
                  <div style={helpTextStyles}>
                    Proyecto preseleccionado
                  </div>
                )}
              </div>

              {/* Título */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Título *</label>
                <input
                  type="text"
                  name="title"
                  value={taskForm.title}
                  onChange={handleFormChange}
                  placeholder="Ingrese el título de la tarea"
                  required
                  disabled={submitting}
                  style={inputStyles}
                />
              </div>

              {/* Descripción */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Descripción</label>
                <textarea
                  rows={3}
                  name="description"
                  value={taskForm.description || ''}
                  onChange={handleFormChange}
                  placeholder="Descripción detallada de la tarea (opcional)"
                  disabled={submitting}
                  style={textareaStyles}
                />
              </div>

              {/* Estado y Prioridad */}
              <div style={rowStyles}>
                <div style={colStyles}>
                  <label style={labelStyles}>Estado</label>
                  <select
                    name="status"
                    value={taskForm.status}
                    onChange={handleFormChange}
                    disabled={submitting}
                    style={selectStyles}
                  >
                    <option value="Todo">Por Hacer</option>
                    <option value="In Progress">En Progreso</option>
                    <option value="Review">En Revisión</option>
                    <option value="Done">Completado</option>
                    <option value="Blocked">Bloqueado</option>
                  </select>
                </div>

                <div style={colStyles}>
                  <label style={labelStyles}>Prioridad</label>
                  <select
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleFormChange}
                    disabled={submitting}
                    style={selectStyles}
                  >
                    <option value="Low">Baja</option>
                    <option value="Medium">Media</option>
                    <option value="High">Alta</option>
                    <option value="Critical">Crítica</option>
                  </select>
                </div>
              </div>

              {/* Fecha límite y Horas estimadas */}
              <div style={rowStyles}>
                <div style={colStyles}>
                  <label style={labelStyles}>Fecha límite</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={taskForm.dueDate || ''}
                    onChange={handleFormChange}
                    disabled={submitting}
                    style={inputStyles}
                  />
                </div>

                <div style={colStyles}>
                  <label style={labelStyles}>Horas estimadas</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    min="0"
                    max="1000"
                    step="0.5"
                    value={taskForm.estimatedHours || ''}
                    onChange={handleFormChange}
                    placeholder="0"
                    disabled={submitting}
                    style={inputStyles}
                  />
                </div>
              </div>

              {/* Miembro asignado */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Asignar a</label>
                <select
                  name="assignee_id"
                  value={taskForm.assignee_id === undefined ? '' : taskForm.assignee_id}
                  onChange={handleFormChange}
                  disabled={submitting || loadingMembers}
                  style={selectStyles}
                >
                  <option value="">Sin asignar</option>
                  {loadingMembers ? (
                    <option value="" disabled>Cargando miembros...</option>
                  ) : projectMembers && projectMembers.length > 0 ? (
                    projectMembers.map(member => {
                      if (!member.user) return null;

                      return (
                        <option key={member.id} value={member.user.id}>
                          {getMemberDisplayName(member)} ({member.role})
                        </option>
                      );
                    }).filter(Boolean)
                  ) : (
                    <option value="" disabled>No hay miembros disponibles</option>
                  )}
                </select>
                {!selectedProject ? (
                  <div style={helpTextStyles}>
                    Seleccione un proyecto para ver los miembros
                  </div>
                ) : projectMembers.length === 0 && !loadingMembers ? (
                  <div style={helpTextStyles}>
                    Este proyecto no tiene miembros asignados
                  </div>
                ) : null}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyles}>
          <button 
            onClick={closeModal}
            disabled={submitting}
            style={secondaryButtonStyles}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting || !taskForm.title.trim() || !selectedProject}
            style={primaryButtonStyles}
          >
            {submitting ? (
              <>
                <span style={spinnerInlineStyles}></span>
                Creando...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>✓</span>
                Crear Tarea
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Estilos inline
const modalOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '16px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
  maxWidth: '700px',
  width: '100%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)'
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#f8fafc',
  display: 'flex',
  alignItems: 'center'
};

const closeButtonStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '8px',
  transition: 'all 0.2s'
};

const bodyStyles: React.CSSProperties = {
  flex: 1,
  padding: '24px',
  overflow: 'auto',
  backgroundColor: '#0f172a'
};

const formGroupStyles: React.CSSProperties = {
  marginBottom: '20px'
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  color: '#f8fafc',
  fontSize: '14px',
  fontWeight: 500
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  padding: '12px 16px',
  color: '#f8fafc',
  fontSize: '14px'
};

const selectStyles: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  padding: '12px 16px',
  color: '#f8fafc',
  fontSize: '14px'
};

const textareaStyles: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  padding: '12px 16px',
  color: '#f8fafc',
  fontSize: '14px',
  resize: 'vertical',
  minHeight: '100px'
};

const rowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  marginBottom: '20px'
};

const colStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const helpTextStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  marginTop: '4px'
};

const errorStyles: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: '#ef4444',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '16px'
};

const successStyles: React.CSSProperties = {
  backgroundColor: 'rgba(34, 197, 94, 0.1)',
  border: '1px solid rgba(34, 197, 94, 0.2)',
  color: '#22c55e',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '16px'
};

const loadingStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px',
  gap: '16px'
};

const spinnerStyles: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '3px solid rgba(59, 130, 246, 0.3)',
  borderTop: '3px solid #3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const spinnerInlineStyles: React.CSSProperties = {
  display: 'inline-block',
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginRight: '8px'
};

const footerStyles: React.CSSProperties = {
  padding: '16px 24px',
  borderTop: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px'
};

const secondaryButtonStyles: React.CSSProperties = {
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer'
};

const primaryButtonStyles: React.CSSProperties = {
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center'
};

export default CreateTaskModal;