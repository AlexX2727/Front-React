import React, { useState, useEffect } from 'react';
import TaskCommentsAttachmentsModal from './TaskCommentsAttachmentsModal';

import api from '../api/axios';
import { Task, updateTask, deleteTask, getTaskProjectMembers, User, UpdateTaskDto } from '../api/services';
import './TaskDetailModal.css';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  onEditSuccess: () => void;
  projectMembers?: User[];
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  taskId,
  onEditSuccess,
  projectMembers = []
}) => {
  // Estados
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [members, setMembers] = useState<User[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
  
  // Estados para edición de campo
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editAssigneeId, setEditAssigneeId] = useState<number | null>(null);
  const [editEstimatedHours, setEditEstimatedHours] = useState<number | null>(null);
  const [editActualHours, setEditActualHours] = useState<string>('');
  
  // Cargar detalles de la tarea
  useEffect(() => {
    if (!isOpen || taskId === null) return;
    
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        // Obtener detalles de la tarea
        const response = await api.get(`/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTask(response.data);
        
        // Inicializar campos de edición
        setEditTitle(response.data.title || '');
        setEditDescription(response.data.description || '');
        setEditStatus(response.data.status || 'Todo');
        setEditPriority(response.data.priority || 'Medium');
        setEditDueDate(response.data.dueDate || '');
        setEditAssigneeId(response.data.assignee_id || null);
        setEditEstimatedHours(response.data.estimatedHours || null);
        setEditActualHours(response.data.actualHours || '');
        
        // Cargar miembros del proyecto si no se proporcionan
        if (projectMembers.length === 0 && response.data.project_id) {
          try {
            const membersData = await getTaskProjectMembers(response.data.project_id);
            setMembers(membersData);
          } catch (errMembers) {
            console.error('Error al cargar miembros del proyecto:', errMembers);
          }
        } else {
          setMembers(projectMembers);
        }
      } catch (err) {
        console.error('Error al cargar detalles de la tarea:', err);
        setError('Error al cargar los detalles de la tarea. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetails();
  }, [isOpen, taskId, projectMembers]);
  
  const handleSaveChanges = async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Obtener usuario del localStorage
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      
      // Preparar datos para actualización - asegurarnos de que son válidos
      const updateData: UpdateTaskDto = {};
      
      // Solo añadir campos que realmente han cambiado
      if (editTitle !== task.title) updateData.title = editTitle;
      if (editDescription !== task.description) updateData.description = editDescription || null;
      if (editStatus !== task.status) updateData.status = editStatus;
      if (editPriority !== task.priority) updateData.priority = editPriority;
      if (editDueDate !== task.dueDate) updateData.dueDate = editDueDate || null;
      if (editAssigneeId !== task.assignee_id) updateData.assignee_id = editAssigneeId;
      if ((editEstimatedHours || 0) !== (task.estimatedHours || 0)) updateData.estimatedHours = editEstimatedHours;
      if (editActualHours !== task.actualHours) updateData.actualHours = editActualHours || null;
      
      console.log('Usuario actual:', user?.id);
      console.log('Proyecto de la tarea:', task.project_id);
      console.log('Datos a actualizar:', updateData);
      
      // Verificar si hay datos para actualizar
      if (Object.keys(updateData).length === 0) {
        console.log('No hay cambios para guardar');
        setEditMode(false);
        return;
      }
      
      // Actualizar la tarea
      const updatedTask = await updateTask(task.id, updateData);
      console.log('Tarea actualizada:', updatedTask);
      
      // Actualizar el estado local con los datos actualizados
      setTask(updatedTask);
      
      // Notificar éxito y cerrar edición
      setEditMode(false);
      onEditSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar cambios:', err);
      
      // Mostrar mensaje específico si es error de permisos
      if (err?.response?.status === 403) {
        setError('No tienes permisos para editar esta tarea. Solo el propietario del proyecto o miembros pueden editar tareas.');
      } else {
        setError(`Error al guardar los cambios: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Función para eliminar tarea
  const handleDeleteTask = async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Confirmar eliminación
      if (!confirmDelete) {
        setConfirmDelete(true);
        setLoading(false);
        return;
      }
      
      // Eliminar la tarea
      await deleteTask(task.id);
      
      // Notificar éxito y cerrar modal
      onEditSuccess();
      onClose();
    } catch (err) {
      console.error('Error al eliminar la tarea:', err);
      
      // Mostrar mensaje según el tipo de error
      if ((err as any)?.response?.status === 403) {
        setError('No tienes permisos para eliminar esta tarea. Solo el propietario del proyecto puede eliminar tareas.');
      } else {
        setError('Error al eliminar la tarea. Por favor, intente de nuevo.');
      }
      
      // Resetear confirmación
      setConfirmDelete(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Formatear fecha para mostrar
  const formatFecha = (fechaStr?: string): string => {
    if (!fechaStr) return '';
    
    try {
      // Para el input de tipo date, necesitamos formato YYYY-MM-DD
      return fechaStr.split('T')[0];
    } catch (error) {
      return '';
    }
  };
  
  // Función para obtener nombre de asignado
  const getAssigneeName = (assigneeId?: number): string => {
    if (!assigneeId) return 'Sin asignar';
    
    // Buscar en la lista de miembros
    const assignee = members.find(u => u.id === assigneeId);
    if (assignee) {
      if (assignee.username) return assignee.username;
      if (assignee.firstName && assignee.lastName) 
        return `${assignee.firstName} ${assignee.lastName}`;
      return assignee.firstName || assignee.lastName || `Usuario #${assigneeId}`;
    }
    
    return `Usuario ID: ${assigneeId}`;
  };
  
  // Renderizar estados disponibles
  const renderStatusOptions = () => {
    const options = ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'];
    return options.map(status => (
      <option key={status} value={status}>
        {status === 'Todo' ? 'Por Hacer' : 
         status === 'In Progress' ? 'En Progreso' : 
         status === 'Review' ? 'En Revisión' : 
         status === 'Done' ? 'Completado' : 
         status === 'Blocked' ? 'Bloqueado' : status}
      </option>
    ));
  };
  
  // Renderizar prioridades disponibles
  const renderPriorityOptions = () => {
    const options = ['Low', 'Medium', 'High', 'Critical'];
    return options.map(priority => (
      <option key={priority} value={priority}>
        {priority === 'Low' ? 'Baja' : 
         priority === 'Medium' ? 'Media' : 
         priority === 'High' ? 'Alta' : 
         priority === 'Critical' ? 'Crítica' : priority}
      </option>
    ));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="task-detail-modal-backdrop"
        onClick={() => {
          setConfirmDelete(false);
          setEditMode(false);
          onClose();
        }}
      />
      
      {/* Modal */}
      <div className="task-detail-modal dark-theme">
        <div className="task-detail-modal-dialog">
          <div className="task-detail-modal-content">
            {/* Header */}
            <div className="task-detail-modal-header">
              <h2 className="task-detail-modal-title">
                {editMode 
                  ? 'Editar Tarea' 
                  : confirmDelete 
                    ? 'Confirmar Eliminación' 
                    : task ? `Detalles de la tarea: ${task.title}` : 'Detalles de la Tarea'}
              </h2>
              <button 
                className="task-detail-modal-close"
                onClick={() => {
                  setConfirmDelete(false);
                  setEditMode(false);
                  onClose();
                }}
                disabled={loading}
              >
                ×
              </button>
            </div>
            
            {/* Body */}
            <div className="task-detail-modal-body">
              {loading ? (
                <div className="loading-container">
                  <div className="spinner-border"></div>
                  <p>Cargando...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : confirmDelete ? (
                <div className="delete-confirmation">
                  <p>¿Estás seguro de que deseas eliminar esta tarea?</p>
                  <p><strong>Título:</strong> {task?.title}</p>
                  <p>Esta acción no se puede deshacer.</p>
                </div>
              ) : task ? (
                <div className="task-details">
                  {editMode ? (
                    // Formulario de edición
                    <form className="task-edit-form">
                      <div className="form-group">
                        <label className="form-label">Título</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group col-half">
                          <label className="form-label">Estado</label>
                          <select
                            className="form-control"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            {renderStatusOptions()}
                          </select>
                        </div>
                        
                        <div className="form-group col-half">
                          <label className="form-label">Prioridad</label>
                          <select
                            className="form-control"
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                          >
                            {renderPriorityOptions()}
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group col-half">
                          <label className="form-label">Fecha límite</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formatFecha(editDueDate)}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                        </div>
                        
                        <div className="form-group col-half">
                          <label className="form-label">Asignado a</label>
                          <select
                            className="form-control"
                            value={editAssigneeId || ''}
                            onChange={(e) => setEditAssigneeId(e.target.value ? Number(e.target.value) : null)}
                          >
                            <option value="">Sin asignar</option>
                            {members.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.username || 
                                 (member.firstName && member.lastName 
                                   ? `${member.firstName} ${member.lastName}` 
                                   : member.firstName || member.lastName || `Usuario #${member.id}`)}
                                {member.role ? ` (${member.role})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group col-half">
                          <label className="form-label">Horas estimadas</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.5"
                            value={editEstimatedHours || ''}
                            onChange={(e) => setEditEstimatedHours(e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        
                        <div className="form-group col-half">
                          <label className="form-label">Horas reales</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editActualHours || ''}
                            onChange={(e) => setEditActualHours(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Proyecto</label>
                        <input
                          type="text"
                          className="form-control"
                          value={task.project?.name || ''}
                          disabled
                        />
                        <small className="form-text">
                          No se puede cambiar el proyecto de una tarea existente
                        </small>
                      </div>
                    </form>
                  ) : (
                    // Vista de detalles
                    <div className="task-view">
                      <div className="detail-item">
                        <h5>Título</h5>
                        <p>{task.title}</p>
                      </div>
                      
                      <div className="detail-item">
                        <h5>Descripción</h5>
                        <p>{task.description || 'No hay descripción'}</p>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-item col-half">
                          <h5>Estado</h5>
                          <span className={`estado-badge ${getEstadoClass(task.status)}`}>
                            {getEstadoTexto(task.status)}
                          </span>
                        </div>
                        
                        <div className="detail-item col-half">
                          <h5>Prioridad</h5>
                          <span className={`prioridad-badge ${getPrioridadClass(task.priority)}`}>
                            {getPrioridadTexto(task.priority)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-item col-half">
                          <h5>Fecha límite</h5>
                          <p>{task.dueDate ? formatearFecha(task.dueDate) : 'No definida'}</p>
                        </div>
                        
                        <div className="detail-item col-half">
                          <h5>Asignado a</h5>
                          <p>{getAssigneeName(task.assignee_id)}</p>
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-item col-half">
                          <h5>Horas estimadas</h5>
                          <p>{task.estimatedHours || 'No definidas'}</p>
                        </div>
                        
                        <div className="detail-item col-half">
                          <h5>Horas reales</h5>
                          <p>{task.actualHours || 'No registradas'}</p>
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <h5>Proyecto</h5>
                        <p>{task.project?.name || 'No asignado a proyecto'}</p>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-item col-half">
                          <h5>Creado</h5>
                          <p>{formatearFecha(task.createdAt)}</p>
                        </div>
                        
                        <div className="detail-item col-half">
                          <h5>Última actualización</h5>
                          <p>{formatearFecha(task.updatedAt)}</p>
                        </div>
                      </div>
                      
                      {task.completedAt && (
                        <div className="detail-item">
                          <h5>Completado</h5>
                          <p>{formatearFecha(task.completedAt)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            {/* Footer */}
            <div className="task-detail-modal-footer">
              {confirmDelete ? (
                // Botones para confirmación de eliminación
                <>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setConfirmDelete(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={handleDeleteTask}
                    disabled={loading}
                  >
                    {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                  </button>
                </>
              ) : editMode ? (
                // Botones para modo edición
                <>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setEditMode(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSaveChanges}
                    disabled={loading || !editTitle}
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </>
              ) : (
                // Botones para modo visualización
                <>
                  <button 
                    className="btn btn-danger"
                    onClick={() => setConfirmDelete(true)}
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setEditMode(true)}
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn btn-info"
                    onClick={() => setShowCommentsModal(true)}
                    disabled={loading}
                  >
                    <span>💬</span> Comentarios y Archivos
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {task && (
        <TaskCommentsAttachmentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          taskId={task.id}
          taskTitle={task.title}
          theme="dark"
        />
      )}
    </>
  );
};

// Funciones auxiliares
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

const getPrioridadClass = (prioridad?: string): string => {
  switch (prioridad) {
    case 'Low': return 'prioridad-baja';
    case 'Medium': return 'prioridad-media';
    case 'High': return 'prioridad-alta';
    case 'Critical': return 'prioridad-critica';
    default: return '';
  }
};

const getPrioridadTexto = (prioridad?: string): string => {
  switch (prioridad) {
    case 'Low': return 'Baja';
    case 'Medium': return 'Media';
    case 'High': return 'Alta';
    case 'Critical': return 'Crítica';
    default: return 'No definida';
  }
};

export default TaskDetailModal;