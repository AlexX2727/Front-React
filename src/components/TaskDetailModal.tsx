import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
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
  
  // En TaskDetailModal.tsx - modificar handleSaveChanges

// En TaskDetailModal.tsx - revisa y corrige el handleSaveChanges

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
  
  return (
    <Modal
      show={isOpen}
      onHide={() => {
        setConfirmDelete(false);
        setEditMode(false);
        onClose();
      }}
      centered
      size="lg"
      className="task-detail-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {editMode 
            ? 'Editar Tarea' 
            : confirmDelete 
              ? 'Confirmar Eliminación' 
              : task ? `Detalles de la tarea: ${task.title}` : 'Detalles de la Tarea'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
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
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Título</Form.Label>
                  <Form.Control
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </Form.Group>
                
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        {renderStatusOptions()}
                      </Form.Select>
                    </Form.Group>
                  </div>
                  
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Prioridad</Form.Label>
                      <Form.Select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        {renderPriorityOptions()}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha límite</Form.Label>
                      <Form.Control
                        type="date"
                        value={formatFecha(editDueDate)}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Asignado a</Form.Label>
                      <Form.Select
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
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Horas estimadas</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.5"
                        value={editEstimatedHours || ''}
                        onChange={(e) => setEditEstimatedHours(e.target.value ? Number(e.target.value) : null)}
                      />
                    </Form.Group>
                  </div>
                  
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Horas reales</Form.Label>
                      <Form.Control
                        type="text"
                        value={editActualHours || ''}
                        onChange={(e) => setEditActualHours(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>Proyecto</Form.Label>
                  <Form.Control
                    type="text"
                    value={task.project?.name || ''}
                    disabled
                  />
                  <Form.Text className="text-muted">
                    No se puede cambiar el proyecto de una tarea existente
                  </Form.Text>
                </Form.Group>
              </Form>
            ) : (
              // Vista de detalles
              <div>
                <div className="detail-item">
                  <h5>Título</h5>
                  <p>{task.title}</p>
                </div>
                
                <div className="detail-item">
                  <h5>Descripción</h5>
                  <p>{task.description || 'No hay descripción'}</p>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Estado</h5>
                      <span className={`estado-badge ${getEstadoClass(task.status)}`}>
                        {getEstadoTexto(task.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Prioridad</h5>
                      <span className={`prioridad-badge ${getPrioridadClass(task.priority)}`}>
                        {getPrioridadTexto(task.priority)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Fecha límite</h5>
                      <p>{task.dueDate ? formatearFecha(task.dueDate) : 'No definida'}</p>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Asignado a</h5>
                      <p>{getAssigneeName(task.assignee_id)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Horas estimadas</h5>
                      <p>{task.estimatedHours || 'No definidas'}</p>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Horas reales</h5>
                      <p>{task.actualHours || 'No registradas'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <h5>Proyecto</h5>
                  <p>{task.project?.name || 'No asignado a proyecto'}</p>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Creado</h5>
                      <p>{formatearFecha(task.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="detail-item">
                      <h5>Última actualización</h5>
                      <p>{formatearFecha(task.updatedAt)}</p>
                    </div>
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
      </Modal.Body>
      
      <Modal.Footer>
        {confirmDelete ? (
          // Botones para confirmación de eliminación
          <>
            <Button 
              variant="secondary" 
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteTask}
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
            </Button>
          </>
        ) : editMode ? (
          // Botones para modo edición
          <>
            <Button 
              variant="secondary" 
              onClick={() => setEditMode(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveChanges}
              disabled={loading || !editTitle}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </>
        ) : (
          // Botones para modo visualización
          <>
            <Button 
              variant="danger" 
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
            >
              Eliminar
            </Button>
            <Button 
              variant="secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cerrar
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setEditMode(true)}
              disabled={loading}
            >
              Editar
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
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