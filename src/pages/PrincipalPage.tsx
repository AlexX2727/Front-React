import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileComponent from "../components/ProfileComponent";
import api from "../api/axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import TaskListModal from '../components/TaskListModal';
import CreateTaskModal from '../components/CreateTaskModal';
import MisProyectosModal from './MisProyectosModal';
import CrearProyectoModal from './CrearProyectoModal';
import ProjectMembersModal from '../components/ProjectMembersModal';


// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Interfaces
interface Owner {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  avatar?: string | null;
}

interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  createdAt?: Date;
  owner: Owner;
  taskCount?: number;
  memberCount?: number;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  project: {
    id: number;
    name: string;
  };
  assignee?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    avatar?: string | null;
  };
}

interface Activity {
  type: 'task_created' | 'task_updated' | 'comment_added' | 'attachment_added';
  id?: number;
  title?: string;
  taskId?: number;
  taskTitle?: string;
  projectId: number;
  projectName: string;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  timestamp: Date;
}

interface DashboardData {
  activeProjects: {
    count: number;
    projects: Project[];
  };
  pendingTasks: {
    count: number;
    tasks: Task[];
  };
  completedTasks: {
    count: number;
    tasks: Task[];
  };
  taskCollaborators: {
    tasks: {
      id: number;
      title: string;
      collaboratorCount: number;
      project: {
        id: number;
        name: string;
      };
    }[];
  };
  recentProjects: {
    projects: Project[];
  };
  recentActivity: {
    activities: Activity[];
  };
  projectProgress: {
    projects: {
      id: number;
      name: string;
      progressPercentage: number;
      completedTasks: number;
      totalTasks: number;
      status: string;
    }[];
  };
}

const PrincipalPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [activeSection, setActiveSection] = useState("inicio");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Sistema de tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Variables para filtros
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('all');
  const [selectedTaskPriorityFilter, setSelectedTaskPriorityFilter] = useState('all');
  
  // Estados de carga para filtros
  const [isFilteringActivity, setIsFilteringActivity] = useState(false);
  const [isFilteringTasks, setIsFilteringTasks] = useState(false);
  const [isRefreshingActivity, setIsRefreshingActivity] = useState(false);
  const [isRefreshingTasks, setIsRefreshingTasks] = useState(false);
  
  // Estado para el modal de tareas
  const [showTaskListModal, setShowTaskListModal] = useState<boolean>(false);
const [showCreateTaskModal, setShowCreateTaskModal] = useState<boolean>(false);
const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
const [showProjectsModal, setShowProjectsModal] = useState<boolean>(false);
const [showCreateProjectModal, setShowCreateProjectModal] = useState<boolean>(false);
const [showProjectMembersModal, setShowProjectMembersModal] = useState<boolean>(false);
const [isRefreshing, setIsRefreshing] = useState(false);

// Usuario
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const [userData, setUserData] = useState({ 
    firstName: user?.firstName || 'Usuario', 
    lastName: user?.lastName || 'Desconocido' 
  });

  // Opciones de proyectos para filtros
  const [projectOptions, setProjectOptions] = useState([
    { id: 'all', name: 'Todos los proyectos' }
  ]);

  // Obtener la fecha actual
  const today = new Date();
  const dateString = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Funciones de utilidad
  const getInitials = (firstName?: string, lastName?: string): string => {
    return `${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`;
  };

  const getRelativeTime = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  const translatePriority = (priority?: string): string => {
    const translations: { [key: string]: string } = {
      'critical': 'Crítica',
      'high': 'Alta', 
      'medium': 'Media',
      'low': 'Baja'
    };
    return translations[priority?.toLowerCase() || ''] || priority || '';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'rgba(236, 72, 153, 0.2)';
      case 'high':
        return 'rgba(239, 68, 68, 0.2)';
      case 'medium':
        return 'rgba(245, 158, 11, 0.2)';
      case 'low':
        return 'rgba(16, 185, 129, 0.2)';
      default:
        return 'rgba(107, 114, 128, 0.2)';
    }
  };

  // Función para cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token || !user) {
        navigate('/');
        return;
      }
      
      // Llamada real a tu backend
      const response = await api.get("/dashboard");
      const data = response.data;
      
      // Procesar las fechas que vienen como strings del backend
      if (data.pendingTasks?.tasks) {
        data.pendingTasks.tasks = data.pendingTasks.tasks.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null
        }));
      }
      
      if (data.completedTasks?.tasks) {
        data.completedTasks.tasks = data.completedTasks.tasks.map((task: any) => ({
          ...task,
          completedAt: task.completedAt ? new Date(task.completedAt) : null
        }));
      }
      
      if (data.recentActivity?.activities) {
        data.recentActivity.activities = data.recentActivity.activities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
      }
      
      if (data.recentProjects?.projects) {
        data.recentProjects.projects = data.recentProjects.projects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
      }

      setDashboardData(data);

      // Configurar opciones de proyecto para los filtros
      setProjectOptions([
        { id: 'all', name: 'Todos los proyectos' },
        ...(data?.activeProjects?.projects || []).map((p: Project) => ({
          id: p.id.toString(),
          name: p.name
        }))
      ]);

      setError(null);
    } catch (err: any) {
      console.error("Error al cargar los datos del dashboard:", err);
      
      // Manejar diferentes tipos de errores
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
        return;
      }
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'No se pudieron cargar los datos del dashboard. Por favor, inténtalo de nuevo más tarde.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
  };

  // Funciones de manejo de eventos
  const handleTaskClick = (taskId: number) => {
    // Solo navegación al modal de tareas, SIN pasar taskId específico
    setShowTaskListModal(true);
  };
  const handleViewTaskDetails = (taskId: number) => {
    // Para casos específicos donde quieras ir directo a un detalle
    setSelectedTaskId(taskId);
    setShowTaskListModal(true);
  };
  
  const handleActivityFilterChange = async () => {
    setIsFilteringActivity(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsFilteringActivity(false);
  };

  const handleTaskFilterChange = async () => {
    setIsFilteringTasks(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsFilteringTasks(false);
  };

  const refreshActivity = async () => {
    setIsRefreshingActivity(true);
    try {
      await loadDashboardData();
    } catch (err) {
      console.error('Error al refrescar actividades:', err);
    } finally {
      setIsRefreshingActivity(false);
    }
  };

  const refreshTasks = async () => {
    setIsRefreshingTasks(true);
    try {
      await loadDashboardData();
    } catch (err) {
      console.error('Error al refrescar tareas:', err);
    } finally {
      setIsRefreshingTasks(false);
    }
  };

  const openTaskListModal = () => {
    console.log('🚀 ABRIENDO TaskListModal...');
    console.log('User:', user);
    console.log('Estado antes:', showTaskListModal);
    setShowTaskListModal(true);
    console.log('Estado después de setState:', true);
  };
  
  const closeTaskListModal = () => {
    console.log('❌ CERRANDO TaskListModal...');
    setShowTaskListModal(false);
    setSelectedTaskId(null);
  };
  
  const openCreateTaskModal = () => {
    console.log('🚀 ABRIENDO CreateTaskModal...');
    setShowCreateTaskModal(true);
  };
  
  const closeCreateTaskModal = () => {
    console.log('❌ CERRANDO CreateTaskModal...');
    setShowCreateTaskModal(false);
  };
  
  // 4. MEJORAR handleTaskSuccess:
  const handleTaskSuccess = () => {
    console.log('Tarea actualizada exitosamente');
    // Recargar datos del dashboard después de crear/actualizar una tarea
    loadDashboardData();
  };

  const openProjectsModal = () => {
    console.log('🚀 ABRIENDO ProjectsModal...');
    setShowProjectsModal(true);
  };
  
  const closeProjectsModal = () => {
    console.log('❌ CERRANDO ProjectsModal...');
    setShowProjectsModal(false);
  };
  
  const handleCreateProjectClick = () => {
    // En lugar de navegar, abrir el modal
    setShowCreateProjectModal(true);
  };

  const closeCreateProjectModal = () => {
    console.log('❌ CERRANDO CreateProjectModal...');
    setShowCreateProjectModal(false);
  };

  const openProjectMembersModal = () => {
    console.log('🚀 ABRIENDO ProjectMembersModal...');
    setShowProjectMembersModal(true);
  };
  
  const closeProjectMembersModal = () => {
    console.log('❌ CERRANDO ProjectMembersModal...');
    setShowProjectMembersModal(false);
  };
  
  const handleMemberSuccess = () => {
    console.log('✅ Miembro actualizado exitosamente');
    // Recargar datos del dashboard si es necesario
    loadDashboardData();
  };
  
 
  // Funciones de gráficos
  const getPriorityChartData = () => {
    if (!dashboardData) return { labels: [], datasets: [] };
    
    const pendingTasks = dashboardData.pendingTasks?.tasks || [];
    const priorityStats = { critical: 0, high: 0, medium: 0, low: 0 };
    
    pendingTasks.forEach(task => {
      const priority = task.priority?.toLowerCase();
      if (priority === 'critical') priorityStats.critical++;
      else if (priority === 'high') priorityStats.high++;
      else if (priority === 'medium') priorityStats.medium++;
      else if (priority === 'low') priorityStats.low++;
    });

    return {
      labels: ['Crítica', 'Alta', 'Media', 'Baja'],
      datasets: [{
        label: 'Tareas por Prioridad',
        data: [priorityStats.critical, priorityStats.high, priorityStats.medium, priorityStats.low],
        backgroundColor: [
          'rgba(236, 72, 153, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderWidth: 0,
        borderRadius: 12,
        borderSkipped: false
      }]
    };
  };

  const getStatusChartData = () => {
    if (!dashboardData) return { labels: [], datasets: [] };
    
    const pendingTasks = dashboardData.pendingTasks?.tasks || [];
    const completedTasks = dashboardData.completedTasks?.tasks || [];
    const statusStats = { todo: 0, inProgress: 0, review: 0, done: completedTasks.length };
    
    pendingTasks.forEach(task => {
      const status = task.status?.toLowerCase();
      if (status === 'todo') statusStats.todo++;
      else if (status === 'in progress') statusStats.inProgress++;
      else if (status === 'review') statusStats.review++;
    });

    return {
      labels: ['Completadas', 'En Progreso', 'Pendientes', 'En Revisión'],
      datasets: [{
        data: [statusStats.done, statusStats.inProgress, statusStats.todo, statusStats.review],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  };

  const getWeeklyChartData = () => {
    if (!dashboardData) return { labels: [], datasets: [] };
    
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
    const data = [];
    const labels = [];
    
    // Usar datos reales de tareas completadas del backend
    const completedTasks = dashboardData.completedTasks?.tasks || [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
      
      // Contar tareas completadas en este día específico
      const tasksCompletedOnDay = completedTasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate.toDateString() === date.toDateString();
      }).length;
      
      data.push(tasksCompletedOnDay);
    }

    return {
      labels,
      datasets: [{
        label: 'Tareas Completadas',
        data,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4
      }]
    };
  };
  // Opciones de gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 12,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((context.parsed.y / total) * 100) : 0;
            return `${context.parsed.y} tareas (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: '#64748b', 
          stepSize: 1,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        grid: { 
          color: 'rgba(71, 85, 105, 0.2)', 
          drawBorder: false 
        }
      },
      x: {
        ticks: { 
          color: '#64748b',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        grid: { display: false }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { 
          color: '#f8fafc', 
          padding: 20, 
          usePointStyle: true, 
          pointStyle: 'circle' as const,
          font: {
            size: 13,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 12,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      duration: 1500
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: '#64748b', 
          stepSize: 1,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        grid: { 
          color: 'rgba(71, 85, 105, 0.2)', 
          drawBorder: false 
        }
      },
      x: {
        ticks: { 
          color: '#64748b',
          maxTicksLimit: selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 6 : 5,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        grid: { 
          color: 'rgba(71, 85, 105, 0.1)', 
          drawBorder: false 
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };
  const getProjectProgressChartData = () => {
    if (!dashboardData?.projectProgress?.projects) return { labels: [], datasets: [] };
    
    const projectProgress = dashboardData.projectProgress.projects;
    const projectNames = projectProgress.map(p => p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name);
    const progressPercentages = projectProgress.map(p => p.progressPercentage);
    
    return {
      labels: projectNames,
      datasets: [{
        label: 'Progreso del Proyecto (%)',
        data: progressPercentages,
        backgroundColor: progressPercentages.map(percentage => {
          if (percentage >= 80) return 'rgba(34, 197, 94, 0.8)';
          if (percentage >= 50) return 'rgba(245, 158, 11, 0.8)';
          if (percentage >= 25) return 'rgba(59, 130, 246, 0.8)';
          return 'rgba(239, 68, 68, 0.8)';
        }),
        borderColor: progressPercentages.map(percentage => {
          if (percentage >= 80) return 'rgba(34, 197, 94, 1)';
          if (percentage >= 50) return 'rgba(245, 158, 11, 1)';
          if (percentage >= 25) return 'rgba(59, 130, 246, 1)';
          return 'rgba(239, 68, 68, 1)';
        }),
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  };

  const progressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 12,
        callbacks: {
          label: function(context: any) {
            const project = dashboardData?.projectProgress?.projects[context.dataIndex];
            return [
              `Progreso: ${context.parsed.x}%`,
              `Completadas: ${project?.completedTasks || 0}`,
              `Total: ${project?.totalTasks || 0}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value: any) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(71, 85, 105, 0.2)',
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        grid: {
          display: false
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };


  // Efectos
  useEffect(() => {
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    
    // Log para debugging
    console.log('Usuario actual:', user);
    console.log('Token:', localStorage.getItem('token'));
    
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Buenos días");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Buenas tardes");
    } else {
      setGreeting("Buenas noches");
    }
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, [navigate, user, currentTime]);

  useEffect(() => {
    console.log('🔄 useEffect de carga inicial ejecutándose...');
    const fetchData = async () => {
      if (!isLoading && !isRefreshing) {
        await loadDashboardData();
      }
    };
    fetchData();
    
    // Configurar recarga automática cada 5 minutos
    const intervalId = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        loadDashboardData();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      console.log('🧹 Limpiando intervalo de recarga...');
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (selectedActivityFilter && dashboardData) {
      handleActivityFilterChange();
    }
  }, [selectedActivityFilter]);

  useEffect(() => {
    if (selectedTaskPriorityFilter && dashboardData) {
      handleTaskFilterChange();
    }
  }, [selectedTaskPriorityFilter]);

  useEffect(() => {
    console.log('Modal states changed:', {
      showTaskListModal,
      showCreateTaskModal,
      selectedTaskId,
      user: user?.id
    });
  }, [showTaskListModal, showCreateTaskModal, selectedTaskId]);
  // En PrincipalPage, agrega esto después de los otros useEffect
useEffect(() => {
  console.log('📊 Estado modales:', {
    showProjectMembersModal,
    showTaskListModal,
    showCreateTaskModal,
    showProjectsModal,
    showCreateProjectModal
  });
}, [showProjectMembersModal, showTaskListModal, showCreateTaskModal, showProjectsModal, showCreateProjectModal]);

  // Renderizar contenido según la sección activa
 // Renderizar contenido según la sección activa
 const renderActiveSection = () => {
  switch (activeSection) {
    case "perfil":
      return <ProfileComponent user={user} />;
    case "inicio":
    default:
      return renderDashboard();
  }
};

// Renderizar contenido del dashboard
const renderDashboard = () => {
  if (isLoading) {
    return (
      <div style={styles.loadingState}>
        <div style={styles.spinnerCircle}></div>
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorState}>
        <div style={styles.errorIcon}>⚠️</div>
        <h3>Error al cargar los datos</h3>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={loadDashboardData}>Reintentar</button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={styles.errorState}>
        <div style={styles.errorIcon}>📊</div>
        <h3>No hay datos disponibles</h3>
        <p>No se encontraron métricas para mostrar en el dashboard</p>
      </div>
    );
  }

  const completionRate = dashboardData.pendingTasks.count > 0 ? 
  Math.round((dashboardData.completedTasks.count / (dashboardData.pendingTasks.count + dashboardData.completedTasks.count)) * 100) : 0;

return (
  <div style={styles.dashboardContent}>
    {/* Sistema de Tabs */}
    <div style={styles.tabsContainer}>
      <div style={styles.tabsHeader}>
        <div style={styles.tabsNav}>
          {['dashboard', 'projects', 'activity', 'tasks'].map((tab) => (
            <button 
              key={tab}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab ? styles.tabButtonActive : {})
              }}
              onClick={() => changeTab(tab)}
              className="tab-button"
            >
              {tab === 'dashboard' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9"/>
                  <rect x="14" y="3" width="7" height="5"/>
                  <rect x="14" y="12" width="7" height="9"/>
                  <rect x="3" y="16" width="7" height="5"/>
                </svg>
              )}
              {tab === 'projects' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              )}
              {tab === 'activity' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
              )}
              {tab === 'tasks' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              )}
              <span style={{ marginLeft: '8px' }}>
                {tab === 'dashboard' && 'Dashboard'}
                {tab === 'projects' && 'Proyectos'}
                {tab === 'activity' && 'Actividad'}
                {tab === 'tasks' && 'Tareas'}
              </span>
            </button>
          ))}
        </div>
        
        {activeTab === 'dashboard' && (

          <div style={styles.filtersRight}>
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              style={styles.filterSelect}
              className="filter-select"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
            
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              style={styles.filterSelect}
              className="filter-select"
            >
              {projectOptions.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            
            <button style={styles.refreshBtn} onClick={loadDashboardData} className="refresh-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23,4 23,10 17,10"/>
                <polyline points="1,20 1,14 7,14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              <span style={{ marginLeft: '8px' }}>Actualizar</span>
            </button>
          </div>
        )}
      </div>
    </div>


         {/* Dashboard Analytics */}
         {activeTab === 'dashboard' && (
          <div style={styles.tabContent}>
            {/* Métricas principales */}
            <div style={styles.metricsGrid}>
              <div style={{...styles.metricCard, borderTop: '3px solid #3b82f6'}} className="metric-card">
                <div style={styles.metricHeader}>
                  <div style={{...styles.metricIcon, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div style={styles.metricTrend}>+12%</div>
                </div>
                <h3 style={styles.metricValue}>{dashboardData.activeProjects.count}</h3>
                <p style={styles.metricLabel}>Proyectos Activos</p>
              </div>
              
              <div style={{...styles.metricCard, borderTop: '3px solid #8b5cf6'}} className="metric-card">
                <div style={styles.metricHeader}>
                  <div style={{...styles.metricIcon, backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  </div>
                  <div style={styles.metricTrend}>+8%</div>
                </div>
                <h3 style={styles.metricValue}>{dashboardData.pendingTasks.count}</h3>
                <p style={styles.metricLabel}>Tareas Pendientes</p>
              </div>
              
              <div style={{...styles.metricCard, borderTop: '3px solid #10b981'}} className="metric-card">
                <div style={styles.metricHeader}>
                  <div style={{...styles.metricIcon, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                  <div style={styles.metricTrend}>+24%</div>
                </div>
                <h3 style={styles.metricValue}>{dashboardData.completedTasks.count}</h3>
                <p style={styles.metricLabel}>Completadas</p>
              </div>
              
              <div style={{...styles.metricCard, borderTop: '3px solid #f59e0b'}} className="metric-card">
                <div style={styles.metricHeader}>
                  <div style={{...styles.metricIcon, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                  </div>
                  <div style={styles.metricTrend}>+5%</div>
                </div>
                <h3 style={styles.metricValue}>{completionRate}%</h3>
                <p style={styles.metricLabel}>Eficiencia</p>
              </div>
            </div>
            <div style={styles.quickActionsSection}>
    <div style={styles.quickActionsCard}>
      <div style={styles.quickActionsHeader}>
        <div>
          <h3 style={styles.quickActionsTitle}>🚀 Gestión Rápida de Tareas</h3>
          <p style={styles.quickActionsSubtitle}>Accede rápidamente a tus tareas y crea nuevas</p>
        </div>
      </div>
      
      <div style={styles.quickActionsButtons}>
      <button 
  style={styles.quickActionBtn}
  onClick={openTaskListModal}  // <-- Función simplificada
  className="quick-action-btn"
>
          <div style={styles.quickActionIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div style={styles.quickActionContent}>
            <h4 style={styles.quickActionTitle}>Ver Mis Tareas</h4>
            <p style={styles.quickActionDesc}>Gestiona todas tus tareas asignadas</p>
            <span style={styles.quickActionCount}>{dashboardData.pendingTasks.count} pendientes</span>
          </div>
        </button>
        
        <button 
  style={styles.quickActionBtn}
  onClick={openCreateTaskModal}  // <-- Función simplificada
  className="quick-action-btn"
>
          <div style={styles.quickActionIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div style={styles.quickActionContent}>
            <h4 style={styles.quickActionTitle}>Nueva Tarea</h4>
            <p style={styles.quickActionDesc}>Crea una nueva tarea rápidamente</p>
            <span style={styles.quickActionCount}>Crear ahora</span>
          </div>
        </button>
      </div>
    </div>
  </div>
            
           {/* Gráficos principales */}
           <div style={styles.chartsGrid}>
              <div style={styles.chartCard} className="chart-card">
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>Distribución por Prioridad</h3>
                </div>
                <div style={styles.chartContainer}>
                  <Bar data={getPriorityChartData()} options={chartOptions} />
                </div>
              </div>
              
              <div style={styles.chartCard} className="chart-card">
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>Estado de Tareas</h3>
                </div>
                <div style={styles.chartContainer}>
                  <Doughnut data={getStatusChartData()} options={doughnutOptions} />
                </div>
              </div>
            </div>

             {/* Gráficos temporales */}
            <div style={styles.chartsGrid}>
              <div style={styles.chartCard} className="chart-card">
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>
                    Productividad - {selectedTimeRange === '7d' ? 'Últimos 7 días' : selectedTimeRange === '30d' ? 'Últimos 30 días' : 'Últimos 90 días'}
                  </h3>
                </div>
                <div style={styles.chartContainer}>
                  <Line data={getWeeklyChartData()} options={lineOptions} />
                </div>
              </div>
              
              <div style={styles.chartCard} className="chart-card">
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>Progreso de Proyectos</h3>
                </div>
                <div style={styles.chartContainer}>
                  <Bar data={getProjectProgressChartData()} options={progressChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Proyectos Activos */}
        {activeTab === 'projects' && (
          <div style={styles.tabContent}>
            <div style={styles.tabHeader}>
              <div>
                <h2 style={styles.tabTitle}>Proyectos Activos</h2>
                <p style={styles.tabSubtitle}>Gestiona y supervisa todos tus proyectos en curso</p>
              </div>
              <button style={styles.createBtn} onClick={() => navigate('/crear-proyecto')} className="create-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span style={{ marginLeft: '8px' }}>Nuevo Proyecto</span>
              </button>
            </div>
            
            <div style={styles.projectsGrid}>
            {dashboardData.activeProjects.projects.map((project) => (
  <div key={project.id} style={styles.projectCard} className="project-card">
                  <div style={styles.projectHeader}>
                    <span style={styles.statusBadge}>
                      {project.status === 'active' ? 'Activo' : project.status}
                    </span>
                  </div>
                  
                  <h3 style={styles.projectName}>{project.name}</h3>
                  <p style={styles.projectDescription}>{project.description || 'Sin descripción disponible'}</p>
                  
                  <div style={styles.projectStats}>
                    <div style={styles.statItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      <span>{project.taskCount || 0} tareas</span>
                    </div>
                    <div style={styles.statItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                      </svg>
                      <span>{project.memberCount || 0} miembros</span>
                    </div>
                  </div>
                  
                  <div style={styles.progressSection}>
                    <div style={styles.progressInfo}>
                      <span style={styles.progressLabel}>Progreso</span>
                      <span style={styles.progressPercentage}>75%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{...styles.progressFill, width: '75%'}}></div>
                    </div>
                  </div>
                  
                  <div style={styles.projectFooter}>
                    <div style={styles.projectOwner}>
                      <div style={styles.ownerAvatar}>
                        <span>{getInitials(project.owner.firstName, project.owner.lastName)}</span>
                      </div>
                      <div style={styles.ownerInfo}>
                        <span style={styles.ownerName}>{project.owner.firstName} {project.owner.lastName}</span>
                        <span style={styles.ownerRole}>Propietario</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actividad Reciente */}
        {activeTab === 'activity' && (
          <div style={styles.tabContent}>
            <div style={styles.tabHeader}>
              <div>
                <h2 style={styles.tabTitle}>Actividad Reciente</h2>
                <p style={styles.tabSubtitle}>Mantente al día con las últimas actualizaciones del equipo</p>
              </div>
              <div style={styles.activityFilters}>
              <select 
  style={styles.filterSelect} 
  value={selectedActivityFilter}
  onChange={(e) => setSelectedActivityFilter(e.target.value)}
  className="filter-select"
>
                  <option value="all">Todas las actividades</option>
                  <option value="tasks">Solo tareas</option>
                  <option value="comments">Solo comentarios</option>
                  <option value="attachments">Solo archivos</option>
                </select>
                
                <button style={styles.refreshBtnSecondary} onClick={refreshActivity} disabled={isRefreshingActivity} className="refresh-btn-secondary">
                  {isRefreshingActivity ? (
                    <div style={styles.miniSpinner}></div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23,4 23,10 17,10"/>
                      <polyline points="1,20 1,14 7,14"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                  )}
                  <span style={{ marginLeft: '8px' }}>Actualizar</span>
                </button>
              </div>
            </div>
            
            {isFilteringActivity ? (
              <div style={styles.loadingState}>
                <div style={styles.spinnerCircle}></div>
                <p>Aplicando filtros...</p>
              </div>
            ) : (
              <div style={styles.activityTimeline}>
                {dashboardData.recentActivity.activities.slice(0, 5).map((activity, index) => (
               <div key={index} style={styles.activityItem} className="activity-item">
                    <div style={styles.activityIcon}>
                      {activity.type === 'task_created' ? '📋' : 
                       activity.type === 'comment_added' ? '💬' : 
                       activity.type === 'attachment_added' ? '📎' : '✏️'}
                    </div>
                    
                    <div style={styles.activityContent}>
                      <div style={styles.activityHeader}>
                        <div style={styles.activityUser}>
                          <div style={styles.userAvatar}>
                            <span>{getInitials(activity.userName.split(' ')[0], activity.userName.split(' ')[1] || '')}</span>
                          </div>
                          <div style={styles.userDetails}>
                            <span style={styles.userName}>{activity.userName}</span>
                            <span style={styles.activityTime}>{getRelativeTime(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={styles.activityDescription}>
                        <p>
                          <span style={styles.activityAction}>
                            {activity.type === 'task_created' ? 'creó la tarea' : 
                             activity.type === 'comment_added' ? 'comentó en' : 
                             activity.type === 'attachment_added' ? 'adjuntó un archivo a' : 'actualizó'}
                          </span>{' '}
                          <span style={styles.taskLink}>
                            {activity.type === 'task_created' || activity.type === 'task_updated' ? activity.title : activity.taskTitle}
                          </span>{' '}
                          en <strong>{activity.projectName}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Tareas Pendientes */}
        {activeTab === 'tasks' && (
          <div style={styles.tabContent}>
            <div style={styles.tabHeader}>
              <div>
                <h2 style={styles.tabTitle}>Tareas Pendientes</h2>
                <p style={styles.tabSubtitle}>Organiza y prioriza tu trabajo pendiente</p>
              </div>
              <div style={styles.tasksFilters}>
              <select 
  style={styles.filterSelect} 
  value={selectedTaskPriorityFilter}
  onChange={(e) => setSelectedTaskPriorityFilter(e.target.value)}
  className="filter-select"
>
                  <option value="all">Todas las prioridades</option>
                  <option value="critical">Crítica</option>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
                
                <button style={styles.refreshBtnSecondary} onClick={refreshTasks} disabled={isRefreshingTasks} className="refresh-btn-secondary">
                  {isRefreshingTasks ? (
                    <div style={styles.miniSpinner}></div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23,4 23,10 17,10"/>
                      <polyline points="1,20 1,14 7,14"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                  )}
                  <span style={{ marginLeft: '8px' }}>Actualizar</span>
                </button>
              </div>
            </div>
            
            {isFilteringTasks ? (
              <div style={styles.loadingState}>
                <div style={styles.spinnerCircle}></div>
                <p>Aplicando filtros...</p>
              </div>
            ) : (
              <div style={styles.tasksBoard}>
                <div style={styles.boardColumns}>
                  {/* Por hacer */}
                  <div style={styles.boardColumn}>
                    <div style={styles.columnHeader}>
                      <h3 style={styles.columnTitle}>Por hacer</h3>
                      <span style={styles.taskCount}>
                        {dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'todo').length}
                      </span>
                    </div>
                    <div style={styles.columnTasks}>
                      {dashboardData.pendingTasks.tasks
                        .filter(t => t.status.toLowerCase() === 'todo')
                        .map((task) => (
                          <div key={task.id} style={styles.taskCard} onClick={() => handleTaskClick(task.id)} className="task-card">
                          <div style={styles.taskHeader}>
                            <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(task.priority)}}>
                              {translatePriority(task.priority)}
                            </span>
                          </div>
                          
                          <h4 style={styles.taskTitle}>{task.title}</h4>
                          
                          <div style={styles.taskMeta}>
                            <div style={styles.metaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                              </svg>
                              <span>{task.project.name}</span>
                            </div>
                            <div style={styles.metaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>
                                {task.dueDate ? 
                                  new Date(task.dueDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'}) : 
                                  'Sin fecha'
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div style={styles.taskFooter}>
                            {task.assignee ? (
                              <div style={styles.taskAssignee}>
                                <div style={styles.assigneeAvatar}>
                                  <span>{getInitials(task.assignee.firstName, task.assignee.lastName)}</span>
                                </div>
                                <span style={styles.assigneeName}>{task.assignee.firstName}</span>
                              </div>
                            ) : (
                              <span style={styles.unassigned}>Sin asignar</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* En progreso */}
                  <div style={styles.boardColumn}>
                    <div style={styles.columnHeader}>
                      <h3 style={styles.columnTitle}>En progreso</h3>
                      <span style={styles.taskCount}>
                        {dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'in progress').length}
                      </span>
                    </div>
                    <div style={styles.columnTasks}>
                      {dashboardData.pendingTasks.tasks
                        .filter(t => t.status.toLowerCase() === 'in progress')
                        .map((task) => (
                          <div key={task.id} style={styles.taskCard} onClick={() => handleTaskClick(task.id)} className="task-card">
                          <div style={styles.taskHeader}>
                            <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(task.priority)}}>
                              {translatePriority(task.priority)}
                            </span>
                          </div>
                          
                          <h4 style={styles.taskTitle}>{task.title}</h4>
                          
                          <div style={styles.taskMeta}>
                            <div style={styles.metaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                              </svg>
                              <span>{task.project.name}</span>
                            </div>
                            <div style={styles.metaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>
                                {task.dueDate ? 
                                  new Date(task.dueDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'}) : 
                                  'Sin fecha'
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div style={styles.taskFooter}>
                            {task.assignee ? (
                              <div style={styles.taskAssignee}>
                                <div style={styles.assigneeAvatar}>
                                  <span>{getInitials(task.assignee.firstName, task.assignee.lastName)}</span>
                                </div>
                                <span style={styles.assigneeName}>{task.assignee.firstName}</span>
                              </div>
                            ) : (
                              <span style={styles.unassigned}>Sin asignar</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* En revisión */}
                  <div style={styles.boardColumn}>
                    <div style={styles.columnHeader}>
                      <h3 style={styles.columnTitle}>En revisión</h3>
                      <span style={styles.taskCount}>
                        {dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'review').length}
                      </span>
                    </div>
                    <div style={styles.columnTasks}>
                      {dashboardData.pendingTasks.tasks
                        .filter(t => t.status.toLowerCase() === 'review')
                        .map((task) => (
                          <div key={task.id} style={styles.taskCard} onClick={() => handleTaskClick(task.id)} className="task-card">
                          <div style={styles.taskHeader}>
                            <span style={{...styles.priorityBadge, backgroundColor: getPriorityColor(task.priority)}}>
                              {translatePriority(task.priority)}
                            </span>
                          </div>
                          
                          <h4 style={styles.taskTitle}>{task.title}</h4>
                          
                          <div style={styles.taskMeta}>
                            <div style={styles.metaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                              </svg>
                              <span>{task.project.name}</span>
                            </div>
                            <div style={styles.metaItem}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>
                                {task.dueDate ? 
                                  new Date(task.dueDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'}) : 
                                  'Sin fecha'
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div style={styles.taskFooter}>
                            {task.assignee ? (
                              <div style={styles.taskAssignee}>
                                <div style={styles.assigneeAvatar}>
                                  <span>{getInitials(task.assignee.firstName, task.assignee.lastName)}</span>
                                </div>
                                <span style={styles.assigneeName}>{task.assignee.firstName}</span>
                              </div>
                            ) : (
                              <span style={styles.unassigned}>Sin asignar</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* MODALES CON DEBUGGING */}
      {console.log('Rendering modales:', { showTaskListModal, showCreateTaskModal })}
      <CrearProyectoModal
        key={`create-project-${showCreateProjectModal}`}
        isOpen={showCreateProjectModal}
        onClose={closeCreateProjectModal}
        onSuccess={async (newProject) => {
          console.log('✅ Proyecto creado exitosamente:', newProject);
          // Cerrar el modal
          closeCreateProjectModal();
          // Esperar un momento para asegurar que la animación de cierre termine
          await new Promise(resolve => setTimeout(resolve, 300));
          // Actualizar los datos solo si no hay otra actualización en curso
          if (!isLoading && !isRefreshing) {
            console.log('🔄 Actualizando datos después de crear proyecto...');
            setIsRefreshing(true);
            try {
              await loadDashboardData();
            } catch (error) {
              console.error('Error al actualizar datos:', error);
            } finally {
              setIsRefreshing(false);
            }
          }
        }}
      />
      <TaskListModal
        isOpen={showTaskListModal}
        onClose={closeTaskListModal}
        theme="dark"
      />
  
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={closeCreateTaskModal}
        onTaskCreated={() => {
          handleTaskSuccess();
          closeCreateTaskModal();
        }}
        theme="dark"
      />
      
      <MisProyectosModal
  isOpen={showProjectsModal}
  onClose={closeProjectsModal}
  onCreateProjectClick={handleCreateProjectClick}
/>
<ProjectMembersModal
      isOpen={showProjectMembersModal}
      onClose={closeProjectMembersModal}
      onSuccess={handleMemberSuccess}
    />

      {/* Botón hamburguesa móvil */}
      {isMobile && (
        <button
          style={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <aside style={{
        ...styles.sidebar,
        transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
      }}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="18" stroke="currentColor" strokeWidth="2.5" />
              <path d="M16 25L22 31L34 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={styles.logoText}>
            <span style={styles.appName}>Task<span style={styles.highlight}>Master</span></span>
            <span style={styles.appVersion}>Pro</span>
          </div>
        </div>
        
        <nav style={styles.menu}>
          <div style={styles.menuSection}>
            <span style={styles.sectionTitle}>Principal</span>
            <button 
              style={{
                ...styles.menuItem,
                ...(activeSection === 'inicio' ? styles.menuItemActive : {})
              }} 
              onClick={() => setActiveSection('inicio')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              <span>Dashboard</span>
            </button>
            <button style={styles.menuItem} onClick={openProjectsModal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Proyectos</span>
            </button>
            <button style={styles.menuItem} onClick={openTaskListModal}>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
  <span>Tareas</span>
</button>

          </div>
          
          <div style={styles.menuSection}>
            <span style={styles.sectionTitle}>Colaboración</span>
            <button style={styles.menuItem} onClick={openProjectMembersModal}>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
  <span>Equipo</span>
</button>
            <button 
              style={{
                ...styles.menuItem,
                ...(activeSection === 'perfil' ? styles.menuItemActive : {})
              }} 
              onClick={() => setActiveSection('perfil')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Perfil</span>
            </button>
          </div>
        </nav>
        
        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      
      {/* Overlay móvil */}
      {isMobile && isMobileMenuOpen && (
        <div
          style={styles.menuOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <main style={{
  ...styles.mainContent,
  marginLeft: isMobile ? '0' : '280px',
  width: isMobile ? '100vw' : 'calc(100vw - 280px)', // CAMBIADO: usar viewport width
  maxWidth: isMobile ? '100vw' : 'calc(100vw - 280px)', // CAMBIADO: usar viewport width
  padding: isMobile ? '60px 16px 16px' : '24px'
}}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.welcomeTitle}>
              {greeting}, <span style={styles.userName}>{userData.firstName}</span> 
              <span style={styles.wave}>👋</span>
            </h1>
            <p style={styles.date}>{dateString}</p>
          </div>
          
          <div style={styles.headerRight}>
            <div style={styles.userProfile} onClick={() => setActiveSection('perfil')}>
              
              <div style={styles.userAvatar}>
                <span>{getInitials(userData.firstName, userData.lastName)}</span>
              </div>
              {!isMobile && (
                <div style={styles.userInfo}>
                  <span style={styles.userNameProfile}>{userData.firstName} {userData.lastName}</span>
                  <span style={styles.userRole}>Administrador</span>
                </div>
              )}
            </div>
            
          </div>
          
        </header>
        
        {/* Contenido activo */}
        {renderActiveSection()}
      </main>

    {/* Estilos globales */}
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          overflow-x: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
        }
        
        #root {
          width: 100vw !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }
        
        .container {
          width: 100vw !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }
        
        .main-content {
          width: calc(100vw - 280px) !important;
          max-width: calc(100vw - 280px) !important;
          box-sizing: border-box !important;
          padding: 24px !important;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Scrollbar personalizado */ 
        .dashboard-content::-webkit-scrollbar, 
        .tab-content::-webkit-scrollbar, 
        .sidebar::-webkit-scrollbar { 
          width: 8px; 
        } 
        
        .dashboard-content::-webkit-scrollbar-track, 
        .tab-content::-webkit-scrollbar-track, 
        .sidebar::-webkit-scrollbar-track { 
          background: rgba(30, 41, 59, 0.3); 
          border-radius: 4px; 
        } 
        
        .dashboard-content::-webkit-scrollbar-thumb, 
        .tab-content::-webkit-scrollbar-thumb, 
        .sidebar::-webkit-scrollbar-thumb { 
          background: rgba(59, 130, 246, 0.5); 
          border-radius: 4px; 
        }
        
        /* Efectos de hover mejorados */ 
        .metric-card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); 
        } 
        
        .chart-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); 
        } 
        
        .project-card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); 
          border-color: rgba(59, 130, 246, 0.3); 
        } 
        
        .activity-item:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2); 
          border-color: rgba(59, 130, 246, 0.3); 
        } 
        
        .task-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); 
          border-color: rgba(59, 130, 246, 0.3); 
        } 
        
        .user-profile:hover { 
          background: rgba(59, 130, 246, 0.1); 
          border-color: rgba(59, 130, 246, 0.3); 
        } 
        
        .menu-item:hover:not(.active) { 
          background: rgba(59, 130, 246, 0.1); 
          color: #f8fafc; 
          transform: translateX(4px); 
        } 
        
        .logout-btn:hover { 
          background: rgba(239, 68, 68, 0.2); 
          border-color: rgba(239, 68, 68, 0.3); 
          transform: translateY(-1px); 
        } 
        
        .refresh-btn:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); 
        } 
        
        .refresh-btn-secondary:hover:not(:disabled) { 
          background: rgba(59, 130, 246, 0.1); 
          border-color: rgba(59, 130, 246, 0.3); 
          color: #3b82f6; 
          transform: translateY(-1px); 
        } 
        
        .create-btn:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); 
        } 
        
        .tab-button:hover:not(.active) { 
          color: #f8fafc; 
          background: rgba(59, 130, 246, 0.1); 
        } 
        
        .filter-select:focus { 
          outline: none; 
          border-color: #3b82f6; 
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); 
        } 
        
        .filter-select:hover { 
          border-color: rgba(59, 130, 246, 0.5); 
        } 
        
        /* Mejoras de responsive */ 
        @media (max-width: 1400px) { 
          .charts-grid { 
            grid-template-columns: 1fr !important; 
          } 
          
          .projects-grid { 
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important; 
          } 
          
          .board-columns { 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; 
            gap: 20px !important; 
          } 
        } 
        
        @media (max-width: 1200px) { 
          .metrics-grid { 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important; 
          } 
          
          .projects-grid { 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important; 
          } 
        } 
        
        @media (max-width: 992px) { 
          .tabs-header { 
            flex-direction: column !important; 
            align-items: stretch !important; 
            gap: 16px !important; 
          } 
          
          .tabs-nav { 
            overflow-x: auto !important; 
            scrollbar-width: none !important; 
            -ms-overflow-style: none !important; 
            white-space: nowrap !important; 
            padding: 8px !important; 
          } 
          
          .tabs-nav::-webkit-scrollbar { 
            display: none !important; 
          } 
          
          .filters-right { 
            flex-direction: column !important; 
            gap: 12px !important; 
            width: 100% !important; 
          } 
          
          .filter-select { 
            min-width: auto !important; 
            width: 100% !important; 
          } 
          
          .refresh-btn { 
            width: 100% !important; 
            justify-content: center !important; 
          } 
          
          .tab-header { 
            flex-direction: column !important; 
            align-items: stretch !important; 
            gap: 16px !important; 
          } 
          
          .activity-filters, .tasks-filters { 
            flex-direction: column !important; 
            gap: 12px !important; 
          } 
          
          .activity-filters .filter-select, .tasks-filters .filter-select { 
            width: 100% !important; 
            min-width: auto !important; 
          } 
          
          .refresh-btn-secondary { 
            width: 100% !important; 
            justify-content: center !important; 
          } 
          
          .metrics-grid { 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important; 
            gap: 16px !important; 
          } 
          
          .board-columns { 
            grid-template-columns: 1fr !important; 
            gap: 16px !important; 
          } 
        } 
        
        @media (max-width: 768px) {
          .main-content {
            width: 100vw !important;
            max-width: 100vw !important;
            margin-left: 0 !important;
            padding: 60px 16px 16px !important;
          }
        
          .metrics-grid { 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 12px !important; 
          } 
          
          .metric-card { 
            padding: 16px !important; 
          } 
          
          .metric-icon { 
            width: 40px !important; 
            height: 40px !important; 
          } 
          
          .metric-value { 
            font-size: 24px !important; 
          } 
          
          .metric-label { 
            font-size: 12px !important; 
          } 
          
          .charts-grid { 
            gap: 16px !important; 
          }
          
          .chart-container { 
            height: 250px !important; 
          } 
          
          .chart-card {
            width: 100% !important;
            box-sizing: border-box;
          }
          
          .chart-title { 
            font-size: 16px !important; 
          } 
          
          .projects-grid { 
            grid-template-columns: 1fr !important; 
            gap: 16px !important; 
          } 
          
          .project-card { 
            padding: 16px !important; 
          } 
          
          .project-name { 
            font-size: 16px !important; 
          } 
          
          .activity-timeline { 
            gap: 16px !important; 
          } 
          
          .activity-item { 
            gap: 12px !important; 
          } 
          
          .activity-icon { 
            width: 40px !important; 
            height: 40px !important; 
          } 
          
          .activity-content { 
            padding: 16px !important; 
          } 
          
          .board-columns { 
            grid-template-columns: 1fr !important; 
            gap: 16px !important; 
          } 
          
          .board-column { 
            padding: 16px !important; 
          } 
          
          .user-info { 
            display: none !important; 
          } 
          
          .create-btn { 
            padding: 10px 16px !important; 
            font-size: 13px !important; 
          } 
        } 
        
        @media (max-width: 480px) { 
          .main-content {
            width: 100vw !important;
            max-width: 100vw !important;
            margin-left: 0 !important;
            padding: 60px 12px 12px !important;
          }
        
          .tab-title { 
            font-size: 18px !important; 
          } 
          
          .tab-subtitle { 
            font-size: 13px !important; 
          } 
          
          .metrics-grid { 
            grid-template-columns: 1fr !important; 
            gap: 12px !important; 
          } 
          
          .metric-card, .chart-card, .project-card, .activity-item { 
            padding: 14px !important; 
          } 
          
          .metric-icon { 
            width: 36px !important; 
            height: 36px !important; 
          } 
          
          .metric-value { 
            font-size: 20px !important; 
          } 
          
          .chart-container {
            width: 100% !important;
            height: 300px !important;
            position: relative;
          }
          
          .chart-title { 
            font-size: 15px !important; 
          } 
          
          .activity-icon { 
            width: 32px !important; 
            height: 32px !important; 
          } 
          
          .user-avatar { 
            width: 28px !important; 
            height: 28px !important; 
            font-size: 11px !important; 
          } 
          
          .board-column { 
            padding: 12px !important; 
          } 
          
          .task-card { 
            padding: 12px !important; 
          } 
          
          .task-title { 
            font-size: 13px !important; 
          } 
          
          .filter-select { 
            padding: 10px !important; 
            font-size: 14px !important; 
          } 
          
          .refresh-btn, .refresh-btn-secondary, .create-btn { 
            padding: 10px 14px !important; 
            font-size: 14px !important; 
          } 
          
          /* Arreglar altura del gráfico de línea */
          .chart-card .chart-container canvas {
            max-height: 300px !important;
          }
          
          /* Mejorar el aspecto de los gráficos */
          .chart-card {
            min-height: 400px;
          }
          
          .chart-container {
            height: 300px !important;
            width: 100% !important;
          }
            .quick-action-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.quick-action-btn:hover .quick-action-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

/* Responsive para acciones rápidas */
@media (max-width: 768px) {
  .quick-actions-buttons {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  
  .quick-action-btn {
    padding: 16px !important;
    gap: 12px !important;
  }
  
  .quick-action-icon {
    width: 40px !important;
    height: 40px !important;
  }
  
  .quick-action-title {
    font-size: 15px !important;
  }
  
  .quick-action-desc {
    font-size: 13px !important;
  }
}
        }
      `}</style>
    </div>
  );
};

// Estilos CSS


const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#f8fafc',
    width: '100vw', // CAMBIADO: usar viewport width
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
    boxSizing: 'border-box'
  },


  mobileMenuButton: {
    position: 'fixed',
    top: '15px',
    left: '15px',
    zIndex: 200,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    color: '#ffffff',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    fontSize: '20px',
    padding: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)'
  },

  sidebar: {
    width: '280px',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(71, 85, 105, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    position: 'fixed',
    height: '100vh',
    zIndex: 10,
    transition: 'transform 0.3s ease',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(30, 41, 59, 0.3)'
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    marginBottom: '40px',
    gap: '12px'
  },

  logoIcon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },

  logoText: {
    display: 'flex',
    flexDirection: 'column'
  },

  appName: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f8fafc'
  },

  highlight: {
    color: '#3b82f6'
  },

  appVersion: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  menu: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '0 24px',
    gap: '32px'
  },

  menuSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    paddingLeft: '12px'
  },

  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    color: '#cbd5e1',
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    textAlign: 'left',
    position: 'relative'
  },

  menuItemActive: {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)',
    color: '#3b82f6',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
  },

  sidebarFooter: {
    padding: '0 24px',
    marginTop: 'auto'
  },

  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },

  menuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5
  },

  mainContent: {
    flex: 1,
    marginLeft: '280px',
    padding: '24px', // SIMPLIFICADO: padding uniforme
    height: '100vh',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    width: 'calc(100vw - 280px)', // CAMBIADO: usar viewport width
    maxWidth: 'calc(100vw - 280px)', // CAMBIADO: usar viewport width
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '20px',
    padding: '20px 24px',
    flexShrink: 0,
    width: '100%',
    boxSizing: 'border-box'
  },

  headerLeft: {
    display: 'flex',
    flexDirection: 'column'
  },

  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 600,
    margin: 0,
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  userName: {
    color: '#3b82f6',
    fontWeight: 700
  },

  wave: {
    display: 'inline-block',
    animation: 'wave 2s infinite',
    transformOrigin: '70% 70%',
    marginLeft: '8px'
  },

  date: {
    color: '#64748b',
    fontSize: '14px',
    margin: '8px 0 0 0',
    fontWeight: 500
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },

  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    padding: '8px 12px',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '16px',
    transition: 'all 0.3s ease'
  },

  userAvatar: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
    color: 'white'
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column'
  },

  userNameProfile: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f8fafc'
  },

  userRole: {
    fontSize: '12px',
    color: '#64748b'
  },
  dashboardContent: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box',
    paddingRight: '0' // ELIMINADO: padding derecho
  },

  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '24px',
    color: '#64748b'
  },

  spinnerCircle: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(59, 130, 246, 0.3)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
    color: '#f8fafc',
    textAlign: 'center',
    padding: '0 24px'
  },

  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },

  retryBtn: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  tabsContainer: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '32px',
    flexShrink: 0,
    width: '100%',
    boxSizing: 'border-box'
  },

  tabsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    width: '100%'
  },

  tabsNav: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(30, 41, 59, 0.5)',
    padding: '6px',
    borderRadius: '16px',
    border: '1px solid rgba(71, 85, 105, 0.2)'
  },

  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'transparent',
    border: 'none',
    borderRadius: '12px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },

  tabButtonActive: {
    color: '#f8fafc',
    background: 'rgba(59, 130, 246, 0.2)',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },

  filtersRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },

  filterSelect: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: 500,
    minWidth: '160px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },

  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },

  refreshBtnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },

  miniSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#3b82f6',
    animation: 'spin 1s linear infinite'
  },

  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
    animation: 'fadeInUp 0.5s ease-out',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(30, 41, 59, 0.3)',
    width: '100%'
  },

  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px'
  },

  tabTitle: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 4px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  tabSubtitle: {
    color: '#64748b',
    margin: 0,
    fontSize: '14px',
    fontWeight: 500
  },

  activityFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },

  tasksFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },

  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
    width: '100%'
  },

  metricCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '20px',
    padding: '24px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },

  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },

  metricIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  metricTrend: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600
  },

  metricValue: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 4px',
    color: '#f8fafc'
  },

  metricLabel: {
    color: '#64748b',
    margin: 0,
    fontSize: '14px',
    fontWeight: 500
  },

  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  chartCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    boxSizing: 'border-box'
  },

  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },

  chartTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: '#f8fafc'
  },
  chartContainer: {
    flex: 1,
    minHeight: '300px',
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box'
  },

  // Nuevos estilos para las secciones específicas
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
    width: '100%'
  },

  projectCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '20px',
    padding: '24px',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },

  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },

  statusBadge: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'capitalize',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981'
  },

  projectName: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 8px',
    color: '#f8fafc'
  },

  projectDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 16px',
    lineHeight: 1.5
  },

  projectStats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '16px'
  },

  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#64748b'
  },

  progressSection: {
    marginBottom: '16px'
  },

  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },

  progressLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: 500
  },

  progressPercentage: {
    fontSize: '13px',
    color: '#f8fafc',
    fontWeight: 600
  },

  progressBar: {
    height: '6px',
    background: 'rgba(71, 85, 105, 0.3)',
    borderRadius: '3px',
    overflow: 'hidden'
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '3px',
    transition: 'width 0.3s ease'
  },

  projectFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  projectOwner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  ownerAvatar: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '12px',
    color: 'white'
  },

  ownerInfo: {
    display: 'flex',
    flexDirection: 'column'
  },

  ownerName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#f8fafc'
  },

  ownerRole: {
    fontSize: '12px',
    color: '#64748b'
  },

  // Estilos para actividad
  activityTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },

  activityItem: {
    display: 'flex',
    gap: '16px',
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '16px',
    padding: '20px',
    transition: 'all 0.3s ease'
  },

  activityIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    fontSize: '20px',
    flexShrink: 0
  },

  activityContent: {
    flex: 1,
    minWidth: 0
  },

  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },

  activityUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  userDetails: {
    display: 'flex',
    flexDirection: 'column'
  },

  activityTime: {
    fontSize: '12px',
    color: '#64748b'
  },

  activityDescription: {
    marginBottom: '16px'
  },

  activityAction: {
    color: '#64748b'
  },

  taskLink: {
    color: '#3b82f6',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer'
  },

  // Estilos para el board de tareas
  tasksBoard: {
    width: '100%'
  },

  boardColumns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    minHeight: '600px'
  },

  boardColumn: {
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '16px',
    padding: '20px',
    minHeight: '100%'
  },

  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },

  columnTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f8fafc',
    margin: 0
  },

  taskCount: {
    background: 'rgba(71, 85, 105, 0.3)',
    color: '#cbd5e1',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600
  },

  columnTasks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },

  taskCard: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },

  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },

  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  taskTitle: {
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 8px',
    color: '#f8fafc',
    lineHeight: 1.4
  },

  taskMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px'
  },

  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748b'
  },

  taskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  taskAssignee: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  assigneeAvatar: {
    width: '24px',
    height: '24px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '10px',
    color: 'white',
    flexShrink: 0
  },

  assigneeName: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#f8fafc'
  },

  unassigned: {
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic'
  },

  quickActionsSection: {
    marginBottom: '32px',
    width: '100%'
  },
  
  quickActionsCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.2)',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  
  quickActionsHeader: {
    marginBottom: '24px'
  },
  
  quickActionsTitle: {
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#f8fafc'
  },
  
  quickActionsSubtitle: {
    color: '#64748b',
    margin: 0,
    fontSize: '14px',
    fontWeight: 500
  },
  
  quickActionsButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  
  quickActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: '16px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'inherit'
  },
  
  quickActionIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  
  quickActionContent: {
    flex: 1
  },
  
  quickActionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#f8fafc'
  },
  
  quickActionDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 8px',
    lineHeight: 1.4
  },
  
  quickActionCount: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
    
};
export default PrincipalPage;

