import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileComponent from "../components/ProfileComponent";
import api from "../api/axios";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

// Interfaces para los datos
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
}

// Colores para los distintos estados y gráficos
const statusColors = {
  Active: "#4CAF50",
  "In Progress": "#2196F3",
  Pending: "#FFC107",
  Done: "#9C27B0",
  Blocked: "#F44336",
  OnHold: "#FF9800"
};

const priorityColors = {
  High: "#F44336",
  Medium: "#FF9800",
  Low: "#4CAF50"
};

// Estilos
const styles = {
  pageContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#121212",
    color: "#ffffff",
    position: "relative" as const,
  },
  mobileMenuButton: {
    position: "fixed" as const,
    top: "15px",
    left: "15px",
    zIndex: 200,
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    fontSize: "20px",
    padding: "8px 12px",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
  },
  closeMenuButton: {
    position: "absolute" as const,
    top: "10px",
    right: "10px",
    backgroundColor: "transparent",
    color: "#b0b0b0",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    display: "none",
    "@media (max-width: 768px)": {
      display: "block",
    },
  },
  menuOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 99,
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#1a1a1a",
    borderRight: "1px solid #2a2a2a",
    padding: "20px 0",
    display: "flex",
    flexDirection: "column" as const,
    position: "fixed" as const,
    height: "100vh",
    zIndex: 100,
    transition: "left 0.3s ease",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    marginBottom: "30px",
  },
  logoText: {
    marginLeft: "10px",
    fontWeight: "bold" as const,
    fontSize: "20px",
    color: "#f0f0f0",
  },
  nav: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    gap: "5px",
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    border: "none",
    background: "transparent",
    color: "#b0b0b0",
    fontSize: "15px",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    borderLeft: "3px solid transparent",
  },
  activeNavButton: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    color: "#3498db",
    borderLeft: "3px solid #3498db",
  },
  navIcon: {
    marginRight: "10px",
    fontSize: "18px",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    border: "none",
    background: "transparent",
    color: "#b0b0b0",
    fontSize: "15px",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "auto",
    borderTop: "1px solid #2a2a2a",
  },
  mainContent: {
    flex: 1,
    marginLeft: "250px",
    padding: "20px 30px",
    overflowY: "auto" as const,
    maxHeight: "100vh",
    transition: "margin-left 0.3s ease, padding 0.3s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    padding: "10px 0",
    flexWrap: "wrap" as const,
  },
  greeting: {
    display: "flex",
    flexDirection: "column" as const,
  },
  title: {
    fontSize: "24px",
    margin: "0 0 5px 0",
    fontWeight: "500",
    color: "#ffffff",
  },
  userName: {
    color: "#3498db",
  },
  date: {
    margin: 0,
    color: "#9e9e9e",
    fontSize: "14px",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  searchButton: {
    background: "none",
    border: "none",
    color: "#b0b0b0",
    fontSize: "18px",
    padding: "8px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  notificationButton: {
    background: "none",
    border: "none",
    color: "#b0b0b0",
    fontSize: "18px",
    padding: "8px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    position: "relative" as const,
  },
  notificationBadge: {
    position: "absolute" as const,
    top: "0",
    right: "0",
    backgroundColor: "#e74c3c",
    color: "white",
    fontSize: "10px",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#3498db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  dashboard: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "30px",
  },
  // Estadísticas
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  statCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
  },
  statIcon: {
    fontSize: "24px",
    marginRight: "15px",
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    width: "50px",
    height: "50px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    display: "flex",
    flexDirection: "column" as const,
  },
  statValue: {
    margin: "0 0 5px 0",
    fontSize: "24px",
    fontWeight: "600",
  },
  statLabel: {
    margin: 0,
    color: "#9e9e9e",
    fontSize: "14px",
  },
  // Loading y error
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "50px",
    textAlign: "center" as const,
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    marginBottom: "30px",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #1e1e1e",
    borderTopColor: "#3498db",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "50px",
    textAlign: "center" as const,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderRadius: "12px",
    marginBottom: "30px",
  },
  errorIcon: {
    fontSize: "40px",
    marginBottom: "20px",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "50px",
    textAlign: "center" as const,
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    marginBottom: "30px",
  },
  emptyIcon: {
    fontSize: "40px",
    marginBottom: "20px",
  },
  // Gráficos
  chartsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  chartCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
  },
  chartTitle: {
    fontSize: "16px",
    margin: "0 0 15px 0",
    color: "#ffffff",
  },
  chartContainer: {
    height: "200px",
    position: "relative" as const,
  },
  // Columnas
  columnsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
  },
  column: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "500",
  },
  seeAllButton: {
    background: "none",
    border: "none",
    color: "#3498db",
    cursor: "pointer",
    fontSize: "14px",
  },
  // Proyectos
  projectsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  projectCard: {
    backgroundColor: "#252525",
    borderRadius: "8px",
    padding: "15px",
    transition: "all 0.3s ease",
  },
  projectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap" as const,
  },
  projectName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "500",
  },
  projectDescription: {
    fontSize: "14px",
    color: "#b0b0b0",
    margin: "0 0 15px 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    color: "white",
  },
  progressContainer: {
    height: "6px",
    backgroundColor: "#333333",
    borderRadius: "3px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressBar: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  projectInfo: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
    flexWrap: "wrap" as const,
  },
  projectFooter: {
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid #333",
    paddingTop: "10px",
  },
  ownerAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#3498db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold" as const,
    color: "white",
  },
  ownerName: {
    marginLeft: "10px",
    fontSize: "14px",
    color: "#b0b0b0",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    color: "#b0b0b0",
  },
  infoIcon: {
    marginRight: "5px",
    fontSize: "14px",
  },
  createButton: {
    backgroundColor: "#3498db",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    transition: "all 0.3s ease",
  },
  buttonIcon: {
    marginRight: "8px",
  },
  // Tareas
  tasksList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  taskCard: {
    backgroundColor: "#252525",
    borderRadius: "8px",
    padding: "15px",
    transition: "all 0.3s ease",
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap" as const,
  },
  taskTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "500",
  },
  priorityBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    color: "white",
  },
  taskInfo: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
    flexWrap: "wrap" as const,
  },
  taskFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #333",
    paddingTop: "10px",
    flexWrap: "wrap" as const,
  },
  assigneeName: {
    marginLeft: "10px",
    fontSize: "14px",
    color: "#b0b0b0",
  },
  unassigned: {
    fontSize: "14px",
    color: "#9e9e9e",
    fontStyle: "italic" as const,
  },
  // Actividad
  activityFeed: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    backgroundColor: "#252525",
    borderRadius: "8px",
    padding: "15px",
    transition: "all 0.3s ease",
  },
  activityIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "15px",
    fontSize: "18px",
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    margin: "0 0 5px 0",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  activityTime: {
    fontSize: "12px",
    color: "#9e9e9e",
  },
  // Banner
  welcomeBanner: {
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    padding: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    position: "relative" as const,
    flexWrap: "wrap" as const,
  },
  welcomeContent: {
    width: "70%",
    "@media (max-width: 768px)": {
      width: "100%",
    },
  },
  welcomeTitle: {
    fontSize: "24px",
    marginTop: 0,
    marginBottom: "10px",
    color: "#ffffff",
  },
  welcomeText: {
    margin: "0 0 20px 0",
    color: "#b0b0b0",
    lineHeight: "1.5",
  },
  primaryButton: {
    backgroundColor: "#3498db",
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  welcomeGraphic: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
};

// Componente principal
function PrincipalPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [activeSection, setActiveSection] = useState("inicio");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Efecto para detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Configurar saludo y actualizar tiempo
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
    
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

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Cargar todas las métricas del dashboard de una vez
        const response = await api.get("/dashboard");
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar los datos del dashboard:", err);
        setError("No se pudieron cargar los datos del dashboard. Por favor, inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Función para formatear fechas
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Sin fecha";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: isMobile ? 'short' : 'long',
      year: 'numeric'
    });
  };

  // Función para formatear tiempo transcurrido
  const timeAgo = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `Hace ${diffInSeconds} segundos`;
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 2592000) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    if (diffInSeconds < 31536000) return `Hace ${Math.floor(diffInSeconds / 2592000)} meses`;
    return `Hace ${Math.floor(diffInSeconds / 31536000)} años`;
  };

  // Preparar datos para los gráficos
  const getProjectsChartData = () => {
    if (!dashboardData) return null;
    
    // Crear datos para gráfico de proyectos por estado
    const statusCounts: { [key: string]: number } = {};
    dashboardData.activeProjects.projects.forEach(project => {
      if (statusCounts[project.status]) {
        statusCounts[project.status]++;
      } else {
        statusCounts[project.status] = 1;
      }
    });
    
    const labels = Object.keys(statusCounts);
    const data = labels.map(label => statusCounts[label]);
    const backgroundColor = labels.map(label => statusColors[label as keyof typeof statusColors] || "#888");
    
    return {
      labels,
      datasets: [
        {
          label: 'Proyectos por Estado',
          data,
          backgroundColor,
          borderWidth: 1
        }
      ]
    };
  };

  const getTasksChartData = () => {
    if (!dashboardData) return null;
    
    // Crear datos para gráfico de tareas por prioridad
    const pendingByPriority: { [key: string]: number } = {
      'High': 0,
      'Medium': 0,
      'Low': 0
    };
    
    dashboardData.pendingTasks.tasks.forEach(task => {
      if (pendingByPriority[task.priority]) {
        pendingByPriority[task.priority]++;
      } else {
        pendingByPriority[task.priority] = 1;
      }
    });
    
    const labels = Object.keys(pendingByPriority);
    const data = labels.map(label => pendingByPriority[label]);
    const backgroundColor = labels.map(label => priorityColors[label as keyof typeof priorityColors] || "#888");
    
    return {
      labels,
      datasets: [
        {
          label: 'Tareas por Prioridad',
          data,
          backgroundColor,
          borderWidth: 1
        }
      ]
    };
  };

  const getCompletedTasksChartData = () => {
    if (!dashboardData) return null;
    
    // Crear datos para gráfico de tareas completadas por día
    const completedByDate: { [key: string]: number } = {};
    const dateLabels: string[] = [];
    
    // Obtener los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' });
      dateLabels.push(dateStr);
      completedByDate[dateStr] = 0;
    }
    
    dashboardData.completedTasks.tasks.forEach(task => {
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        // Solo contar tareas completadas en los últimos 7 días
        const daysDiff = Math.floor((new Date().getTime() - completedDate.getTime()) / (1000 * 3600 * 24));
        if (daysDiff < 7) {
          const dateStr = completedDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' });
          if (completedByDate[dateStr] !== undefined) {
            completedByDate[dateStr]++;
          }
        }
      }
    });
    
    const data = dateLabels.map(date => completedByDate[date] || 0);
    
    return {
      labels: dateLabels,
      datasets: [
        {
          label: 'Tareas Completadas',
          data,
          fill: false,
          borderColor: '#9C27B0',
          tension: 0.1
        }
      ]
    };
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Renderizar contenido del dashboard
  const renderDashboard = () => {
    if (isLoading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p>Cargando datos del dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <h3>Error al cargar datos</h3>
          <p>{error}</p>
          <button 
            style={styles.primaryButton}
            onClick={() => window.location.reload()}
          >
            Intentar nuevamente
          </button>
        </div>
      );
    }
      if (!dashboardData) {
        return (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>📊</div>
            <h3>No hay datos disponibles</h3>
            <p>No se encontraron métricas para mostrar en el dashboard</p>
          </div>
        );
      }
  
      // Preparar los datos para los gráficos
      const projectsChartData = getProjectsChartData();
      const tasksChartData = getTasksChartData();
      const completedTasksChartData = getCompletedTasksChartData();
  
      // Stats cards
      const stats = [
        { 
          label: "Proyectos Activos", 
          value: dashboardData.activeProjects.count.toString(), 
          icon: "📊",
          color: "rgba(76, 175, 80, 0.1)" 
        },
        { 
          label: "Tareas Pendientes", 
          value: dashboardData.pendingTasks.count.toString(), 
          icon: "📝",
          color: "rgba(33, 150, 243, 0.1)" 
        },
        { 
          label: "Completadas", 
          value: dashboardData.completedTasks.count.toString(), 
          icon: "✅",
          color: "rgba(156, 39, 176, 0.1)" 
        },
        { 
          label: "Colaboradores", 
          value: dashboardData.taskCollaborators.tasks.reduce((sum, task) => sum + task.collaboratorCount, 0).toString(),
          icon: "👥",
          color: "rgba(255, 152, 0, 0.1)" 
        }
      ];
  
      return (
        <div style={styles.dashboard}>
          {/* Tarjetas de estadísticas */}
          <section style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <div key={index} style={styles.statCard} className="stat-card">
                <div style={{...styles.statIcon, backgroundColor: stat.color}}>{stat.icon}</div>
                <div style={styles.statInfo}>
                  <h3 style={styles.statValue}>{stat.value}</h3>
                  <p style={styles.statLabel}>{stat.label}</p>
                </div>
              </div>
            ))}
          </section>
  
          {/* Sección de gráficos */}
          <section style={styles.chartsSection}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Proyectos por Estado</h3>
              <div style={styles.chartContainer}>
                {projectsChartData && (
                  <Doughnut 
                    data={projectsChartData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: '#b0b0b0'
                          }
                        }
                      },
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                )}
              </div>
            </div>
            
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Tareas por Prioridad</h3>
              <div style={styles.chartContainer}>
                {tasksChartData && (
                  <Bar 
                    data={tasksChartData}
                    options={{
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: '#333'
                          },
                          ticks: {
                            color: '#b0b0b0'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: '#b0b0b0'
                          }
                        }
                      },
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                )}
              </div>
            </div>
            
            <div style={{...styles.chartCard, gridColumn: "1 / span 2"}}>
              <h3 style={styles.chartTitle}>Tareas Completadas (Últimos 7 días)</h3>
              <div style={{...styles.chartContainer, height: "200px"}}>
                {completedTasksChartData && (
                  <Line
                    data={completedTasksChartData}
                    options={{
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: '#333'
                          },
                          ticks: {
                            color: '#b0b0b0',
                            stepSize: 1
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: '#b0b0b0'
                          }
                        }
                      },
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                )}
              </div>
            </div>
          </section>
  
          {/* Contenido principal en columnas */}
          <div style={styles.columnsContainer}>
            {/* Columna izquierda - Proyectos activos */}
            <section style={styles.column}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Proyectos Activos</h2>
                <button style={styles.seeAllButton} onClick={() => setActiveSection("proyectos")} className="text-button">
                  Ver todos
                </button>
              </div>
  
              <div style={styles.projectsList}>
                {dashboardData.activeProjects.projects.map((project) => (
                  <div key={project.id} style={styles.projectCard} className="project-card">
                    <div style={styles.projectHeader}>
                      <h3 style={styles.projectName}>{project.name}</h3>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: statusColors[project.status as keyof typeof statusColors] || "#888"
                      }}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p style={styles.projectDescription}>
                      {project.description || "Sin descripción"}
                    </p>
                    
                    <div style={styles.projectInfo}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoIcon}>📝</span>
                        <span>{project.taskCount || 0} tareas</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoIcon}>👥</span>
                        <span>{project.memberCount || 0} miembros</span>
                      </div>
                    </div>
                    
                    <div style={styles.progressContainer}>
                      <div 
                        style={{
                          ...styles.progressBar,
                          width: `${Math.floor(Math.random() * 100)}%`,
                          backgroundColor: statusColors[project.status as keyof typeof statusColors] || "#888"
                        }}
                      />
                    </div>
                    
                    <div style={styles.projectFooter}>
                      <div style={styles.ownerAvatar}>
                        {((project.owner.firstName?.[0] || "") + (project.owner.lastName?.[0] || "")).toUpperCase() || "?"}
                      </div>
                      <span style={styles.ownerName}>
                        {(project.owner.firstName || "") + " " + (project.owner.lastName || "") || project.owner.username || "Usuario"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
  
              <button 
                style={styles.createButton} 
                onClick={() => navigate("/crear-proyecto")}
                className="create-button"
              >
                <span style={styles.buttonIcon}>➕</span> Crear Proyecto
              </button>
            </section>
  
            {/* Columna derecha - Actividad reciente y tareas pendientes */}
            <section style={styles.column}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Actividad Reciente</h2>
              </div>
  
              <div style={styles.activityFeed}>
                {dashboardData.recentActivity.activities.slice(0, 4).map((activity, index) => (
                  <div key={index} style={styles.activityItem} className="activity-item">
                    <div style={{
                      ...styles.activityIcon, 
                      backgroundColor: 
                        activity.type === "task_created" ? "rgba(76, 175, 80, 0.2)" :
                        activity.type === "task_updated" ? "rgba(33, 150, 243, 0.2)" :
                        activity.type === "comment_added" ? "rgba(156, 39, 176, 0.2)" :
                        "rgba(255, 152, 0, 0.2)"
                    }}>
                      {activity.type === "task_created" ? "📋" :
                       activity.type === "task_updated" ? "✏️" :
                       activity.type === "comment_added" ? "💬" : "📎"}
                    </div>
                    <div style={styles.activityContent}>
                      <p style={styles.activityText}>
                        <strong>{activity.userName}</strong> {" "}
                        {activity.type === "task_created" ? "creó una nueva tarea" :
                         activity.type === "task_updated" ? "actualizó una tarea" :
                         activity.type === "comment_added" ? "comentó en" : "adjuntó un archivo a"} {" "}
                        <strong>
                          {activity.type === "task_created" || activity.type === "task_updated" 
                            ? activity.title 
                            : activity.taskTitle}
                        </strong> {" "}
                        en <strong>{activity.projectName}</strong>
                      </p>
                      <span style={styles.activityTime}>{timeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
  
              <div style={{...styles.sectionHeader, marginTop: "20px"}}>
                <h2 style={styles.sectionTitle}>Tareas Pendientes</h2>
                <button style={styles.seeAllButton} onClick={() => setActiveSection("tareas")} className="text-button">
                  Ver todas
                </button>
              </div>
  
              <div style={styles.tasksList}>
                {dashboardData.pendingTasks.tasks.slice(0, 4).map((task) => (
                  <div key={task.id} style={styles.taskCard} className="task-card">
                    <div style={styles.taskHeader}>
                      <h3 style={styles.taskTitle}>{task.title}</h3>
                      <span style={{
                        ...styles.priorityBadge,
                        backgroundColor: priorityColors[task.priority as keyof typeof priorityColors] || "#888"
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <div style={styles.taskInfo}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoIcon}>📂</span>
                        <span>{task.project.name}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoIcon}>🕙</span>
                        <span>{task.dueDate ? formatDate(task.dueDate) : "Sin fecha"}</span>
                      </div>
                    </div>
                    
                    <div style={styles.taskFooter}>
                      {task.assignee ? (
                        <>
                          <div style={styles.ownerAvatar}>
                            {((task.assignee.firstName?.[0] || "") + (task.assignee.lastName?.[0] || "")).toUpperCase() || "?"}
                          </div>
                          <span style={styles.assigneeName}>
                            {(task.assignee.firstName || "") + " " + (task.assignee.lastName || "") || task.assignee.username || "Usuario"}
                          </span>
                        </>
                      ) : (
                        <span style={styles.unassigned}>Sin asignar</span>
                      )}
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: 
                          task.status === "Done" ? "#4CAF50" :
                          task.status === "In Progress" ? "#2196F3" :
                          task.status === "Blocked" ? "#F44336" : "#FF9800"
                      }}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      );
    };
  
    // Función para renderizar la sección activa
    const renderActiveSection = () => {
      switch (activeSection) {
        case "perfil":
          return <ProfileComponent user={user} />;
        case "inicio":
        default:
          return renderDashboard();
      }
    };
  
    return (
      <div style={styles.pageContainer}>
        {/* Botón de hamburguesa para móviles */}
        {isMobile && (
          <button
            style={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
        )}

        {/* Barra lateral - con condición para móviles */}
        <div
          style={{
            ...styles.sidebar,
            left: isMobile && !isMobileMenuOpen ? "-250px" : "0",
            transition: "left 0.3s ease",
          }}
        >
          <div style={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
              <circle className="circle-animation" cx="25" cy="25" r="20" stroke="#3498db" strokeWidth="2" />
              <path className="check-animation" d="M16 25L22 31L34 19" stroke="#3498db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path className="gear-animation" d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={styles.logoText}>Task<span style={{color: "#3498db"}}>Master</span></span>
          </div>
  
          <nav style={styles.nav}>
            <button 
              style={{
                ...styles.navButton, 
                ...(activeSection === "inicio" ? styles.activeNavButton : {})
              }} 
              onClick={() => setActiveSection("inicio")}
              className="nav-button"
            >
              <span style={styles.navIcon}>🏠</span>
              <span>Inicio</span>
            </button>
            <button 
              style={{
              ...styles.navButton, 
              ...(activeSection === "mis-proyectos" ? styles.activeNavButton : {})
              }} 
              onClick={() => navigate("/mis-proyectos")}
              className="nav-button"
            >
              <span style={styles.navIcon}>📋</span>
              <span>Proyectos</span>
            </button>
            <button 
              style={{
                ...styles.navButton, 
                ...(activeSection === "tareas" ? styles.activeNavButton : {})
              }} 
              onClick={() => navigate("/listartareas")}
              className="nav-button"
            >
              <span style={styles.navIcon}>✓</span>
              <span>Tareas</span>
            </button>
            <button 
              style={{
                ...styles.navButton, 
                ...(activeSection === "calendario" ? styles.activeNavButton : {})
              }} 
              onClick={() => setActiveSection("calendario")}
              className="nav-button"
            >
              <span style={styles.navIcon}>📅</span>
              <span>Calendario</span>
            </button>
            <button 
              style={{
                ...styles.navButton, 
                ...(activeSection === "equipo" ? styles.activeNavButton : {})
              }} 
              onClick={() => setActiveSection("equipo")}
              className="nav-button"
            >
              <span style={styles.navIcon}>👥</span>
              <span>Equipo</span>
            </button>
            <button 
              style={{
                ...styles.navButton, 
                ...(activeSection === "perfil" ? styles.activeNavButton : {})
              }} 
              onClick={() => setActiveSection("perfil")}
              className="nav-button"
            >
              <span style={styles.navIcon}>👤</span>
              <span>Perfil</span>
            </button>
          </nav>
  
          <button style={styles.logoutButton} onClick={handleLogout} className="logout-button">
            <span style={styles.navIcon}>🔒</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Overlay para cerrar el menú cuando se hace clic fuera */}
        {isMobile && isMobileMenuOpen && (
          <div
            style={styles.menuOverlay}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Resto del contenido */}
        <div style={styles.mainContent}>
          {/* Encabezado */}
          <header style={styles.header}>
            <div style={styles.greeting}>
              <h1 style={styles.title}>
                {greeting}, <span style={styles.userName}>{user?.firstName || "Usuario"}</span> 👋
              </h1>
              <p style={styles.date}>
                {currentTime.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
  
            <div style={styles.headerActions}>
              <button style={styles.searchButton} className="icon-button">
                <span role="img" aria-label="search">🔍</span>
              </button>
              <button style={styles.notificationButton} className="icon-button">
                <span role="img" aria-label="notifications">🔔</span>
                <span style={styles.notificationBadge}>3</span>
              </button>
              <div style={styles.avatar} onClick={() => setActiveSection("perfil")}>{(user?.firstName?.[0] || "U").toUpperCase()}</div>
            </div>
          </header>
  
          {/* Renderizar el contenido según la sección activa */}
          {renderActiveSection()}
        </div>
  
        {/* Estilos y animaciones */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
            100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
          }
          
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0); }
          }
          
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes drawPath {
            0% { stroke-dashoffset: 300; }
            100% { stroke-dashoffset: 0; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
  
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #121212;
            overflow-x: hidden;
          }
          
          * {
            box-sizing: border-box;
          }
          
          .logo-icon {
            animation: float 6s ease-in-out infinite;
          }
          
          .circle-animation {
            animation: rotate 10s linear infinite;
            transform-origin: center;
          }
          
          .gear-animation {
            animation: rotate 15s linear infinite;
            transform-origin: center;
          }
          
          .path-animation {
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
            animation: drawPath 2s ease-in-out forwards;
          }
          
          .primary-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 7px 14px rgba(52, 152, 219, 0.3);
            animation: pulse 1.5s infinite;
          }
          
          .nav-button:hover {
            background-color: rgba(52, 152, 219, 0.1);
            border-left: 3px solid #3498db;
          }
          
          .logout-button:hover {
            background-color: rgba(231, 76, 60, 0.1);
            color: #e74c3c;
          }
          
          .icon-button:hover {
            background-color: #252525;
          }
          
          .stat-card, .project-card, .activity-item, .task-card, .chart-card {
            animation: fadeIn 0.5s ease-out forwards;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .stat-card:hover, .project-card:hover, .activity-item:hover, .task-card:hover, .chart-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
          }
          
          .text-button:hover {
            color: #3498db;
            text-decoration: underline;
          }
          
          .create-button:hover {
            background-color: #2980b9;
            transform: translateY(-2px);
          }
  
          /* ScrollBar personalizado */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #1e1e1e;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #3a3a3a;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #4a4a4a;
          }
        `}} />
      </div>
    );
  }

  export default PrincipalPage;

