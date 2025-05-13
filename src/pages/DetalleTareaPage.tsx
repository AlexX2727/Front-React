import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
// Eliminar esta importación ya que no la estamos usando
// import { updateTask } from '../api/services';
import './DetalleTareaPage.css';

// Interfaces necesarias - Eliminamos User porque no se usa
interface Task {
  id: number;
  project_id: number;
  assignee_id?: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
  };
  project?: {
    id: number;
    name: string;
    status: string;
  };
}

interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
  };
}

const DetalleTareaPage: React.FC = () => {
  // Obtener el ID de la tarea de los parámetros de la URL
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Estados
  const [task, setTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado del formulario para edición
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    completedAt: '',
    assignee_id: ''
  });
  
  // Cargar datos iniciales
  const loadTaskData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      
      // Obtener datos de la tarea
      const response = await api.get(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const taskData = response.data;
      console.log('TAREA CARGADA:', taskData);
      setTask(taskData);
      
      // Inicializar el formulario con los datos de la tarea
      setEditForm({
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'Todo',
        priority: taskData.priority || 'Medium',
        dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : '',
        estimatedHours: taskData.estimatedHours ? taskData.estimatedHours.toString() : '',
        actualHours: taskData.actualHours || '',
        completedAt: taskData.completedAt ? taskData.completedAt.split('T')[0] : '',
        assignee_id: taskData.assignee_id ? taskData.assignee_id.toString() : ''
      });
      
      // Cargar miembros del proyecto para la asignación
      if (taskData.project_id) {
        const membersResponse = await api.get(`/project-members/project/${taskData.project_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjectMembers(membersResponse.data);
      }
      
    } catch (err) {
      console.error('Error al cargar datos de la tarea:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        setError('Error al cargar los datos de la tarea. Por favor, intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar autenticación y cargar datos
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!storedUser || !token) {
      navigate('/');
      return;
    }
    
    loadTaskData();
  }, [id, navigate]); // Dejamos las dependencias así por ahora
  
  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validar formulario
  const validateForm = (): boolean => {
    setError(null);
    
    // Validar que el título esté presente
    if (!editForm.title.trim()) {
      setError('El título de la tarea es obligatorio');
      return false;
    }
    
    // Validar que las horas estimadas y actuales sean válidas
    if (editForm.estimatedHours && isNaN(Number(editForm.estimatedHours))) {
      setError('Las horas estimadas deben ser un número válido');
      return false;
    }
    
    if (editForm.actualHours && isNaN(Number(editForm.actualHours))) {
      setError('Las horas reales deben ser un número válido');
      return false;
    }
    
    // Validar formato de fecha
    if (editForm.dueDate && isNaN(Date.parse(editForm.dueDate))) {
      setError('La fecha límite no es válida');
      return false;
    }
    
    if (editForm.completedAt && isNaN(Date.parse(editForm.completedAt))) {
      setError('La fecha de completado no es válida');
      return false;
    }
    
    return true;
  };
  
  // Enviar formulario de edición - SOLUCIÓN ALTERNATIVA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!task || !id) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Preparar datos con los tipos correctos
      const updateData = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        status: editForm.status,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
        estimatedHours: editForm.estimatedHours ? parseFloat(editForm.estimatedHours) : null,
        actualHours: editForm.actualHours || null,
        completedAt: editForm.completedAt || null,
        assignee_id: editForm.assignee_id ? parseInt(editForm.assignee_id, 10) : null
      };
      
      // Obtener el token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      console.log('Enviando datos directamente:', updateData);
      
      // SOLUCIÓN: Usar XMLHttpRequest para depurar mejor
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PATCH', `${api.defaults.baseURL}/tasks/${id}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const updatedTask = JSON.parse(xhr.responseText);
              console.log('RESPUESTA EXITOSA:', updatedTask);
              setSuccess('Tarea actualizada correctamente');
              setIsEditing(false);
              
              // Recargar datos
              setTimeout(() => {
                loadTaskData();
              }, 1500);
              resolve();
            } catch (error) {
              console.error('Error al parsear respuesta:', error);
              reject(new Error('Error al parsear la respuesta del servidor'));
            }
          } else {
            console.error('Error del servidor:', xhr.status, xhr.statusText);
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || `Error ${xhr.status}: ${xhr.statusText}`));
            } catch (e) {
              reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
            }
          }
        };
        
        xhr.onerror = function() {
          console.error('Error de red en la solicitud');
          reject(new Error('Error de red en la solicitud'));
        };
        
        // Enviar los datos
        xhr.send(JSON.stringify(updateData));
      })
      .then(() => {
        // Ya manejado dentro de la promesa
      })
      .catch((err) => {
        console.error('Error al actualizar tarea:', err);
        setError(err instanceof Error ? err.message : 'Error al actualizar la tarea');
      })
      .finally(() => {
        setSubmitting(false);
      });
      
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar la tarea');
      setSubmitting(false);
    }
  };
  
  // Formatear fechas para visualización
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No definida';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  // Obtener clase de estado
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
  
  // Obtener texto según estado
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
  
  // Obtener clase de prioridad
  const getPrioridadClass = (prioridad?: string): string => {
    switch (prioridad) {
      case 'Low': return 'prioridad-baja';
      case 'Medium': return 'prioridad-media';
      case 'High': return 'prioridad-alta';
      case 'Critical': return 'prioridad-critica';
      default: return '';
    }
  };
  
  // Volver al listado de tareas
  const handleBack = () => {
    navigate('/tareas');
  };
  
  // Eliminar tarea
  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/');
        return;
      }
      
      await api.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Tarea eliminada correctamente');
      setTimeout(() => {
        navigate('/tareas');
      }, 1500);
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setError('Error al eliminar la tarea. Puede que tenga comentarios o adjuntos relacionados.');
    }
  };
  
  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);
  
  // Renderizar spinner de carga
  if (loading) {
    return (
      <div className="detalle-tarea-container">
        <div className="mensaje-cargando">Cargando datos de la tarea...</div>
      </div>
    );
  }
  
  // Renderizar error si no hay tarea
  if (!task) {
    return (
      <div className="detalle-tarea-container">
        <div className="mensaje-error">No se pudo cargar la tarea o no existe.</div>
        <button className="btn-volver" onClick={handleBack}>Volver al listado</button>
      </div>
    );
  }
  
  return (
    <div className="detalle-tarea-container">
      <div className="detalle-tarea-header">
        <button className="btn-volver" onClick={handleBack}>
          ← Volver
        </button>
        <h1>{isEditing ? 'Editar Tarea' : 'Detalle de Tarea'}</h1>
        <div className="actions-container">
          {!isEditing ? (
            <button className="btn-editar" onClick={() => setIsEditing(true)}>
              Editar
            </button>
          ) : (
            <button className="btn-cancelar" onClick={() => setIsEditing(false)}>
              Cancelar
            </button>
          )}
          <button className="btn-eliminar" onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && <div className="mensaje-error">{error}</div>}
      {success && <div className="mensaje-success">{success}</div>}

      {/* Vista de detalle o formulario de edición */}
      {isEditing ? (
        <form className="tarea-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Información General</h2>
            
            <div className="form-group">
              <label htmlFor="title">Título:</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                value={editForm.title} 
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Descripción:</label>
              <textarea 
                id="description" 
                name="description" 
                value={editForm.description} 
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Estado:</label>
                <select 
                  id="status" 
                  name="status" 
                  value={editForm.status} 
                  onChange={handleInputChange}
                >
                  <option value="Todo">Por Hacer</option>
                  <option value="In Progress">En Progreso</option>
                  <option value="Review">En Revisión</option>
                  <option value="Done">Completado</option>
                  <option value="Blocked">Bloqueado</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Prioridad:</label>
                <select 
                  id="priority" 
                  name="priority" 
                  value={editForm.priority} 
                  onChange={handleInputChange}
                >
                  <option value="Low">Baja</option>
                  <option value="Medium">Media</option>
                  <option value="High">Alta</option>
                  <option value="Critical">Crítica</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Fechas y Tiempos</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dueDate">Fecha límite:</label>
                <input 
                  type="date" 
                  id="dueDate" 
                  name="dueDate" 
                  value={editForm.dueDate} 
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="completedAt">Fecha de completado:</label>
                <input 
                  type="date" 
                  id="completedAt" 
                  name="completedAt" 
                  value={editForm.completedAt} 
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="estimatedHours">Horas estimadas:</label>
                <input 
                  type="number" 
                  id="estimatedHours" 
                  name="estimatedHours" 
                  value={editForm.estimatedHours} 
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="actualHours">Horas reales:</label>
                <input 
                  type="number" 
                  id="actualHours" 
                  name="actualHours" 
                  value={editForm.actualHours} 
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Asignación</h2>
            
            <div className="form-group">
              <label htmlFor="assignee_id">Asignado a:</label>
              <select 
                id="assignee_id" 
                name="assignee_id" 
                value={editForm.assignee_id} 
                onChange={handleInputChange}
              >
                <option value="">Sin asignar</option>
                {projectMembers.map(member => (
                  <option key={member.id} value={member.user.id}>
                    {member.user.fullName || member.user.username} ({member.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-guardar"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      ) : (
        <div className="tarea-detalle">
          <div className="detalle-section">
            <h2>Información General</h2>
            
            <div className="detalle-campo">
              <span className="campo-label">Título:</span>
              <span className="campo-valor titulo-tarea">{task.title}</span>
            </div>
            
            <div className="detalle-campo">
              <span className="campo-label">Proyecto:</span>
              <span className="campo-valor">{task.project?.name || 'No especificado'}</span>
            </div>
            
            <div className="detalle-campo">
              <span className="campo-label">Descripción:</span>
              <div className="campo-valor descripcion-tarea">
                {task.description || 'Sin descripción'}
              </div>
            </div>
            
            <div className="detalle-row">
              <div className="detalle-campo">
                <span className="campo-label">Estado:</span>
                <span className={`estado-badge ${getEstadoClass(task.status)}`}>
                  {getEstadoTexto(task.status)}
                </span>
              </div>
              
              <div className="detalle-campo">
                <span className="campo-label">Prioridad:</span>
                <span className={`prioridad-badge ${getPrioridadClass(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
          
          <div className="detalle-section">
            <h2>Fechas y Tiempos</h2>
            
            <div className="detalle-row">
              <div className="detalle-campo">
                <span className="campo-label">Fecha de creación:</span>
                <span className="campo-valor">{formatDate(task.createdAt)}</span>
              </div>
              
              <div className="detalle-campo">
                <span className="campo-label">Última actualización:</span>
                <span className="campo-valor">{formatDate(task.updatedAt)}</span>
              </div>
            </div>
            
            <div className="detalle-row">
              <div className="detalle-campo">
                <span className="campo-label">Fecha límite:</span>
                <span className="campo-valor">
                  {task.dueDate ? formatDate(task.dueDate) : 'No definida'}
                </span>
              </div>
              
              <div className="detalle-campo">
                <span className="campo-label">Fecha de completado:</span>
                <span className="campo-valor">
                  {task.completedAt ? formatDate(task.completedAt) : 'No completada'}
                </span>
              </div>
            </div>
            
            <div className="detalle-row">
              <div className="detalle-campo">
                <span className="campo-label">Horas estimadas:</span>
                <span className="campo-valor">
                  {task.estimatedHours ? `${task.estimatedHours} horas` : 'No definidas'}
                </span>
              </div>
              
              <div className="detalle-campo">
                <span className="campo-label">Horas reales:</span>
                <span className="campo-valor">
                  {task.actualHours ? `${task.actualHours} horas` : 'No registradas'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="detalle-section">
            <h2>Asignación</h2>
            
            <div className="detalle-campo">
              <span className="campo-label">Asignado a:</span>
              {task.assignee ? (
                <div className="detalle-usuario">
                  <span className="nombre-usuario">
                    {task.assignee.fullName || task.assignee.username}
                  </span>
                  <span className="email-usuario">({task.assignee.email})</span>
                </div>
              ) : (
                <span className="sin-asignar">Sin asignar</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleTareaPage;