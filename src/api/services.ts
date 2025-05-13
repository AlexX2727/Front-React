import api from './axios';

// Interfaces
export interface Project {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
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

export interface CreateTaskDto {
  project_id: number;
  assignee_id?: number | null;  // Debe ser number o null, no undefined
  title: string;
  description?: string | null;  // Debe ser string o null, no undefined
  status?: 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string | null;     // Fecha en formato ISO para PostgreSQL
  estimatedHours?: number | null;  // Float en Prisma
  actualHours?: string | null;     // Float como string para el backend
  completedAt?: string | null;     // Fecha en formato ISO para PostgreSQL
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: string | null;  // Debe ser string como en el backend
  completedAt?: string | null; 
  assignee_id?: number | null;
}

export interface Task {
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
}

// Servicios de proyectos
export const getProjectsByOwner = async (ownerId: number): Promise<Project[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await api.get(`/projects/owner/${ownerId}`, {
      headers: {
        Authorization: `Bearer ${token}`  // Asegurar que el token tiene el prefijo Bearer
      }
    });
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error al obtener proyectos:', error);
    // Si es error de autenticación, limpiar el localStorage
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw error;
  }
};

// Servicios de miembros de proyectos
export const getProjectMembers = async (projectId: number): Promise<ProjectMember[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await api.get(`/project-members/project/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error al obtener miembros:', error);
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw error;
  }
};

// Servicios de tareas
export const createTask = async (taskData: CreateTaskDto): Promise<Task> => {
  let formattedData: CreateTaskDto = { project_id: 0, title: '' }; // Valor inicial para capturar en el catch
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Log inicial para ver los datos recibidos
    console.log('Datos recibidos:', {
      raw: taskData,
      types: {
        project_id: typeof taskData.project_id,
        assignee_id: typeof taskData.assignee_id,
        title: typeof taskData.title,
        dueDate: typeof taskData.dueDate
      }
    });

    // Construir el objeto con tipos correctos
    formattedData = {
      project_id: Number(taskData.project_id),
      title: taskData.title.trim()
    };

    // Procesar assignee_id (debe ser number o null, no undefined)
    if (taskData.assignee_id !== undefined) {
      formattedData.assignee_id = taskData.assignee_id !== null ? 
        Number(taskData.assignee_id) : 
        null;
    }

    // Procesar description (debe ser string o null, no undefined)
    if (taskData.description !== undefined) {
      formattedData.description = taskData.description?.trim() || null;
    }

    // Status y Priority (usar valores por defecto si no están definidos)
    formattedData.status = taskData.status || 'Todo';
    formattedData.priority = taskData.priority || 'Medium';

    // Procesar dueDate (debe ser string ISO o null)
    if (taskData.dueDate) {
      try {
        const date = new Date(taskData.dueDate);
        formattedData.dueDate = date.toISOString();
      } catch (e) {
        formattedData.dueDate = null;
        console.warn('Error al formatear fecha:', e);
      }
    } else {
      formattedData.dueDate = null;
    }

    // Procesar estimatedHours (debe ser number o null)
    if (taskData.estimatedHours !== undefined) {
      formattedData.estimatedHours = taskData.estimatedHours !== null ?
        parseFloat(Number(taskData.estimatedHours).toFixed(2)) :
        null;
    }

    // Log detallado antes de enviar
    console.log('Datos a enviar:', {
      formattedData,
      validation: {
        hasProjectId: typeof formattedData.project_id === 'number',
        projectIdValue: formattedData.project_id,
        hasAssigneeId: formattedData.assignee_id !== undefined,
        assigneeIdValue: formattedData.assignee_id,
        isDateValid: formattedData.dueDate ? new Date(formattedData.dueDate).toISOString() === formattedData.dueDate : true
      }
    });

    const response = await api.post('/tasks', formattedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error detallado:', {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      errors: error?.response?.data?.errors,
      data: error?.response?.data,
      sentData: formattedData
    });
    
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw error;
  }
};

/**
 * Actualiza una tarea existente
 * @param taskId - ID de la tarea a actualizar
 * @param updateData - Datos para actualizar
 * @returns La tarea actualizada
 */
export const updateTask = async (taskId: number, updateData: UpdateTaskDto): Promise<Task> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Log para depuración
    console.log('Datos recibidos para actualización:', updateData);

    // Formatear datos para coincidencia exacta con backend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedData: Record<string, any> = {};

    // Solo incluir campos que tienen valores (para evitar problemas con los nulos)
    if (updateData.title !== undefined) {
      formattedData.title = updateData.title.trim();
    }
    
    if (updateData.description !== undefined) {
      formattedData.description = updateData.description?.trim() || null;
    }
    
    if (updateData.status !== undefined) {
      formattedData.status = updateData.status;
    }
    
    if (updateData.priority !== undefined) {
      formattedData.priority = updateData.priority;
    }
    
    // Procesar dueDate
    if (updateData.dueDate !== undefined) {
      if (updateData.dueDate === null) {
        formattedData.dueDate = null;
      } else {
        // Para fechas, enviar tal cual en formato YYYY-MM-DD
        formattedData.dueDate = updateData.dueDate;
      }
    }
    
    // Procesar completedAt
    if (updateData.completedAt !== undefined) {
      if (updateData.completedAt === null) {
        formattedData.completedAt = null;
      } else {
        // Para fechas, enviar tal cual en formato YYYY-MM-DD
        formattedData.completedAt = updateData.completedAt;
      }
    }
    
    // Procesar estimatedHours
    if (updateData.estimatedHours !== undefined) {
      formattedData.estimatedHours = updateData.estimatedHours;
    }
    
    // Asegurarse de que las horas actuales sean string
    if (updateData.actualHours !== undefined) {
      if (updateData.actualHours === null) {
        formattedData.actualHours = null;
      } else {
        formattedData.actualHours = String(updateData.actualHours);
      }
    }
    
    // Procesar assignee_id
    if (updateData.assignee_id !== undefined) {
      formattedData.assignee_id = updateData.assignee_id;
    }

    // Log de depuración
    console.log('Datos a enviar para actualización (formateados):', formattedData);

    // Enviar actualización
    const response = await api.patch(`/tasks/${taskId}`, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error detallado al actualizar tarea:', {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      errors: error?.response?.data?.errors,
      data: error?.response?.data
    });
    
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw error;
  }
};