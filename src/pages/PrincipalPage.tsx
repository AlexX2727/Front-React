import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PrincipalPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user) {
      navigate("/"); // Si no está logueado, redirige al login
    }
    
    // Actualizar saludo según la hora del día
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Buenos días");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Buenas tardes");
    } else {
      setGreeting("Buenas noches");
    }
    
    // Actualizar la hora cada minuto
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, [navigate, user]);

  // Datos de ejemplo para estadísticas y proyectos recientes
  const stats = [
    { label: "Proyectos Activos", value: "4", icon: "📊" },
    { label: "Tareas Pendientes", value: "12", icon: "📝" },
    { label: "Completadas Hoy", value: "3", icon: "✅" },
    { label: "Colaboradores", value: "5", icon: "👥" }
  ];
  
  const recentProjects = [
    { name: "Rediseño Web", progress: 75, color: "#4CAF50" },
    { name: "App Móvil", progress: 40, color: "#2196F3" },
    { name: "Marketing Q2", progress: 90, color: "#9C27B0" },
    { name: "Base de Datos", progress: 20, color: "#FF9800" }
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={styles.pageContainer}>
      {/* Barra lateral */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
            <circle className="circle-animation" cx="25" cy="25" r="20" stroke="#3498db" strokeWidth="2" />
            <path className="check-animation" d="M16 25L22 31L34 19" stroke="#3498db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path className="gear-animation" d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={styles.logoText}>Task<span style={{color: "#3498db"}}>Master</span></span>
        </div>

        <nav style={styles.nav}>
          <button style={{...styles.navButton, ...styles.activeNavButton}} className="nav-button">
            <span style={styles.navIcon}>🏠</span>
            <span>Inicio</span>
          </button>
          <button style={styles.navButton} className="nav-button" onClick={() => navigate("/mis-proyectos")}>
            <span style={styles.navIcon}>📋</span>
            <span>Proyectos</span>
          </button>
          <button style={styles.navButton} className="nav-button" onClick={() => navigate("/tareas")}>
            <span style={styles.navIcon}>✓</span>
            <span>Tareas</span>
          </button>
          <button style={styles.navButton} className="nav-button" onClick={() => navigate("/calendario")}>
            <span style={styles.navIcon}>📅</span>
            <span>Calendario</span>
          </button>
          <button style={styles.navButton} className="nav-button" onClick={() => navigate("/equipo")}>
            <span style={styles.navIcon}>👥</span>
            <span>Equipo</span>
          </button>
          <button style={styles.navButton} className="nav-button" onClick={() => navigate("/perfil")}>
            <span style={styles.navIcon}>👤</span>
            <span>Perfil</span>
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout} className="logout-button">
          <span style={styles.navIcon}>🔒</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Contenido principal */}
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
            <div style={styles.avatar}>{(user?.firstName?.[0] || "U").toUpperCase()}</div>
          </div>
        </header>

        {/* Dashboard contenido */}
        <div style={styles.dashboard}>
          {/* Estadísticas */}
          <section style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <div key={index} style={styles.statCard} className="stat-card">
                <div style={styles.statIcon}>{stat.icon}</div>
                <div style={styles.statInfo}>
                  <h3 style={styles.statValue}>{stat.value}</h3>
                  <p style={styles.statLabel}>{stat.label}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Banner de bienvenida */}
          <section style={styles.welcomeBanner}>
            <div style={styles.welcomeContent}>
              <h2 style={styles.welcomeTitle}>¡Bienvenido a tu Dashboard!</h2>
              <p style={styles.welcomeText}>
                Organiza tus proyectos, gestiona tus tareas y alcanza tus objetivos con TaskMaster.
              </p>
              <button style={styles.primaryButton} onClick={() => navigate("/crear-proyecto")} className="primary-button">
                Crear Nuevo Proyecto
              </button>
            </div>
            <div style={styles.welcomeGraphic}>
              <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="rgba(52, 152, 219, 0.1)" />
                <path d="M50 100L80 130L150 60" stroke="#3498db" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="path-animation" />
              </svg>
            </div>
          </section>

          {/* Contenido principal en columnas */}
          <div style={styles.columnsContainer}>
            {/* Columna izquierda - Proyectos recientes */}
            <section style={styles.column}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Proyectos Recientes</h2>
                <button style={styles.seeAllButton} onClick={() => navigate("/mis-proyectos")} className="text-button">
                  Ver todos
                </button>
              </div>

              <div style={styles.projectsList}>
                {recentProjects.map((project, index) => (
                  <div key={index} style={styles.projectCard} className="project-card">
                    <div style={styles.projectInfo}>
                      <h3 style={styles.projectName}>{project.name}</h3>
                      <div style={styles.progressContainer}>
                        <div 
                          style={{
                            ...styles.progressBar,
                            width: `${project.progress}%`,
                            backgroundColor: project.color
                          }}
                        />
                      </div>
                      <div style={styles.progressText}>
                        <span>{project.progress}% Completado</span>
                      </div>
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

            {/* Columna derecha - Actividad reciente y próximos eventos */}
            <section style={styles.column}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Actividad Reciente</h2>
              </div>

              <div style={styles.activityFeed}>
                <div style={styles.activityItem} className="activity-item">
                  <div style={{...styles.activityIcon, backgroundColor: "rgba(52, 152, 219, 0.2)"}}>📋</div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}><strong>Ana</strong> creó una nueva tarea en <strong>Rediseño Web</strong></p>
                    <span style={styles.activityTime}>Hace 25 minutos</span>
                  </div>
                </div>
                <div style={styles.activityItem} className="activity-item">
                  <div style={{...styles.activityIcon, backgroundColor: "rgba(46, 204, 113, 0.2)"}}>✅</div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}><strong>Tú</strong> completaste <strong>Diseñar logo</strong></p>
                    <span style={styles.activityTime}>Hace 1 hora</span>
                  </div>
                </div>
                <div style={styles.activityItem} className="activity-item">
                  <div style={{...styles.activityIcon, backgroundColor: "rgba(155, 89, 182, 0.2)"}}>💬</div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}><strong>Carlos</strong> comentó en <strong>Base de Datos</strong></p>
                    <span style={styles.activityTime}>Hace 3 horas</span>
                  </div>
                </div>
              </div>

              <div style={{...styles.sectionHeader, marginTop: "20px"}}>
                <h2 style={styles.sectionTitle}>Próximos Eventos</h2>
              </div>

              <div style={styles.eventsList}>
                <div style={styles.eventItem} className="event-item">
                  <div style={styles.eventDate}>
                    <span style={styles.eventDay}>15</span>
                    <span style={styles.eventMonth}>ABR</span>
                  </div>
                  <div style={styles.eventContent}>
                    <h4 style={styles.eventTitle}>Reunión de Equipo</h4>
                    <p style={styles.eventTime}>10:00 AM - 11:30 AM</p>
                  </div>
                </div>
                <div style={styles.eventItem} className="event-item">
                  <div style={styles.eventDate}>
                    <span style={styles.eventDay}>18</span>
                    <span style={styles.eventMonth}>ABR</span>
                  </div>
                  <div style={styles.eventContent}>
                    <h4 style={styles.eventTitle}>Entrega de Diseños</h4>
                    <p style={styles.eventTime}>Fecha límite</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
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
        
        .stat-card, .project-card, .activity-item, .event-item {
          animation: fadeIn 0.5s ease-out forwards;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover, .project-card:hover, .activity-item:hover, .event-item:hover {
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

const styles = {
  pageContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#121212",
    color: "#ffffff",
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
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    padding: "10px 0",
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
  },
  dashboard: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "30px",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
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
  },
  welcomeContent: {
    width: "70%",
  },
  welcomeTitle: {
    fontSize: "20px",
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
  },
  columnsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
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
  projectInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  projectName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "500",
  },
  progressContainer: {
    height: "6px",
    backgroundColor: "#333333",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#9e9e9e",
    display: "flex",
    justifyContent: "flex-end",
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
  eventsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  eventItem: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#252525",
    borderRadius: "8px",
    padding: "15px",
    transition: "all 0.3s ease",
  },
  eventDate: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    borderRadius: "8px",
    padding: "10px",
    marginRight: "15px",
    minWidth: "60px",
  },
  eventDay: {
    fontSize: "18px",
    fontWeight: "bold" as const,
    color: "#3498db",
  },
  eventMonth: {
    fontSize: "12px",
    color: "#9e9e9e",
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    margin: "0 0 5px 0",
    fontSize: "15px",
    fontWeight: "500",
  },
  eventTime: {
    margin: 0,
    fontSize: "12px",
    color: "#9e9e9e",
  },
};

export default PrincipalPage;