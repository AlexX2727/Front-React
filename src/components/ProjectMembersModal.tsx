import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import AddMemberModal from './AddMemberModal';
import './ProjectMembersModal.css';

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

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface ProjectMembersModalProps {
  projectId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const roles = [
  { label: "Miembro", value: "Member" },
  { label: "Líder", value: "Leader" },
  { label: "Colaborador", value: "Collaborator" },
  { label: "Observador", value: "Observer" },
  { label: "Gerente de Proyecto", value: "ProjectManager" },
];

const ProjectMembersModalContent: React.FC<ProjectMembersModalProps> = ({
  projectId: initialProjectId,
  isOpen,
  onClose,
  onSuccess
}) => {
  // Estados
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Estado para edición
  const [editForm, setEditForm] = useState({
    role: ""
  });

  // Cargar datos iniciales solo cuando el modal se abre
  useEffect(() => {
    if (isOpen && !projects.length) {
      console.log('🚀 Modal abierto, cargando datos...');
      loadData();
    }
  }, [isOpen]);

  // Manejar tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        
        if (showAddMemberModal) {
          setShowAddMemberModal(false);
        } else if (showDeleteConfirm) {
          cancelDelete();
        } else if (editingMemberId) {
          cancelEdit();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, showAddMemberModal, showDeleteConfirm, editingMemberId, onClose]);

  // Reset estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setEditingMemberId(null);
      setShowDeleteConfirm(false);
      setShowAddMemberModal(false);
    }
  }, [isOpen]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('📡 Cargando proyectos para usuario:', user.id);
      
      // Cargar lista de proyectos
      const projectsResponse = await api.get(`/projects/owner/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Proyectos cargados:', projectsResponse.data);
      setProjects(projectsResponse.data);
      
      // Si hay un projectId inicial, cargar ese proyecto
      if (selectedProjectId) {
        await loadProjectMembers(selectedProjectId);
      } else if (projectsResponse.data.length > 0) {
        // Si no hay projectId inicial pero hay proyectos, cargar el primero
        const firstProjectId = projectsResponse.data[0].id;
        setSelectedProjectId(firstProjectId);
        await loadProjectMembers(firstProjectId);
      }
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async (projectId: number) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      console.log('📡 Cargando miembros para proyecto:', projectId);
      
      // Cargar información del proyecto
      const projectResponse = await api.get(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(projectResponse.data);
      
      // Cargar miembros del proyecto
      const membersResponse = await api.get(`/project-members/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Miembros cargados:', membersResponse.data);
      setMembers(membersResponse.data);
    } catch (err) {
      console.error('❌ Error al cargar datos del proyecto:', err);
      setError('Error al cargar los datos del proyecto. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = parseInt(e.target.value);
    setSelectedProjectId(newProjectId);
    await loadProjectMembers(newProjectId);
  };

  const startEdit = (member: ProjectMember) => {
    setEditingMemberId(member.id);
    setEditForm({ role: member.role });
  };

  const cancelEdit = () => {
    setEditingMemberId(null);
  };

  const saveRoleChanges = async (memberId: number) => {
    if (!editForm.role) {
      setError("Debe seleccionar un rol");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');

      await api.patch(`/project-members/${memberId}`, {
        role: editForm.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Rol actualizado exitosamente");
      setEditingMemberId(null);
      
      if (selectedProjectId) {
        await loadProjectMembers(selectedProjectId);
      }
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error al actualizar rol:', err);
      setError(err.response?.data?.message || "Error al actualizar el rol");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteMember = (memberId: number) => {
    setMemberToDelete(memberId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMemberToDelete(null);
  };

  const deleteMember = async () => {
    if (!memberToDelete) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');

      await api.delete(`/project-members/${memberToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Miembro eliminado exitosamente");
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      
      if (selectedProjectId) {
        await loadProjectMembers(selectedProjectId);
      }
      onSuccess();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error al eliminar miembro:', err);
      setError(err.response?.data?.message || "Error al eliminar el miembro");
      setShowDeleteConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const getMemberDisplayName = (member: ProjectMember): string => {
    return member.user.fullName || member.user.username || member.user.email;
  };

  const getRoleLabel = (roleValue: string): string => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  const handleCloseAddMember = () => {
    setShowAddMemberModal(false);
  };

  const handleMemberAdded = () => {
    setShowAddMemberModal(false);
    if (selectedProjectId) {
      loadProjectMembers(selectedProjectId);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      console.log('🖱️ Click en overlay, cerrando modal');
      onClose();
    }
  };

  return (
    <>
      {/* Modal Principal */}
      <div 
        className="project-members-modal-overlay" 
        onClick={handleOverlayClick}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div 
          className="project-members-modal-content" 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid #3b82f6',
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.2)',
            zIndex: 999999
          }}
        >
          <button 
            className="close-button" 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#60a5fa',
              cursor: 'pointer',
              zIndex: 1000000
            }}
          >
            ×
          </button>
          
          <h2 style={{ 
            margin: '0 0 1.5rem',
            color: '#fff',
            fontSize: '1.5rem',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: '0.5rem'
          }}>
            {project ? `Miembros del Proyecto: ${project.name}` : 'Miembros del Proyecto'}
          </h2>

          {/* Selector de proyectos */}
          <div className="project-selector">
            <label htmlFor="project-select">Seleccionar Proyecto:</label>
            <select 
              id="project-select" 
              value={selectedProjectId || ''} 
              onChange={handleProjectChange}
              disabled={loading}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loader"></div>
              <p>Cargando miembros del proyecto...</p>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : success ? (
            <div className="success-message">
              <span>✓</span> {success}
            </div>
          ) : (
            <div className="members-container">
              {members.length === 0 ? (
                <div className="no-members">
                  <p>Este proyecto no tiene miembros asignados.</p>
                  <button className="add-member-btn" onClick={handleAddMember}>
                    Añadir Miembro
                  </button>
                </div>
              ) : (
                <>
                  <div className="members-header">
                    <h3>Miembros ({members.length})</h3>
                    <button className="add-member-btn" onClick={handleAddMember}>
                      + Añadir Miembro
                    </button>
                  </div>
                  
                  <div className="members-list">
                    {members.map(member => (
                      <div key={member.id} className="member-card">
                        <div className="member-info">
                          <div className="member-avatar">
                            {getMemberDisplayName(member).charAt(0).toUpperCase()}
                          </div>
                          <div className="member-details">
                            <h4 className="member-name">{getMemberDisplayName(member)}</h4>
                            <p className="member-email">{member.user.email}</p>
                            
                            {editingMemberId === member.id ? (
                              <div className="edit-role-form">
                                <select 
                                  value={editForm.role}
                                  onChange={(e) => setEditForm({ role: e.target.value })}
                                  className="role-select"
                                  disabled={submitting}
                                >
                                  {roles.map(role => (
                                    <option key={role.value} value={role.value}>
                                      {role.label}
                                    </option>
                                  ))}
                                </select>
                                
                                <div className="edit-actions">
                                  <button 
                                    className="save-btn" 
                                    onClick={() => saveRoleChanges(member.id)}
                                    disabled={submitting}
                                  >
                                    {submitting ? 'Guardando...' : 'Guardar'}
                                  </button>
                                  <button 
                                    className="cancel-btn" 
                                    onClick={cancelEdit}
                                    disabled={submitting}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="member-role">{getRoleLabel(member.role)}</span>
                            )}
                          </div>
                        </div>
                        
                        {editingMemberId !== member.id && (
                          <div className="member-actions">
                            <button 
                              className="action-button edit"
                              onClick={() => startEdit(member)}
                              title="Editar rol"
                            >
                              ✏️
                            </button>
                            <button 
                              className="action-button delete"
                              onClick={() => confirmDeleteMember(member.id)}
                              title="Eliminar miembro"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div 
          className="modal-overlay confirm-overlay" 
          onClick={cancelDelete}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000000,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
            className="delete-confirm-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
              zIndex: 1000001
            }}
          >
            <h3 style={{ color: '#ef4444', margin: '0 0 1rem' }}>¿Estás seguro?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Esta acción eliminará al miembro del proyecto. Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="cancel-btn" onClick={cancelDelete} disabled={submitting}>
                Cancelar
              </button>
              <button className="delete-btn" onClick={deleteMember} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar Miembro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para añadir miembro */}
      {showAddMemberModal && selectedProjectId && (
        <AddMemberModal
          projectId={selectedProjectId}
          onClose={handleCloseAddMember}
          onSuccess={handleMemberAdded}
        />
      )}
    </>
  );
};

// Modal principal que usa Portal
const ProjectMembersModal: React.FC<ProjectMembersModalProps> = (props) => {
  console.log('🎯 ProjectMembersModal Portal render:', { isOpen: props.isOpen });
  
  if (!props.isOpen) {
    return null;
  }

  // Crear el portal en el body
  return ReactDOM.createPortal(
    <ProjectMembersModalContent {...props} />,
    document.body
  );
};

export default ProjectMembersModal;