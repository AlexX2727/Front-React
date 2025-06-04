import { useState } from "react";
import api from "../api/axios";
import "./AddMemberModal.css";

interface AddMemberModalProps {
  projectId: number;
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

function AddMemberModal({ projectId, onClose, onSuccess }: AddMemberModalProps) {
  const [userIdentifier, setUserIdentifier] = useState("");
  const [role, setRole] = useState("Member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeField, setActiveField] = useState("");

  // Manejar focus de campos
  const handleFocus = (fieldName: string) => {
    setActiveField(fieldName);
  };

  const handleBlur = () => {
    setActiveField("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userIdentifier.trim()) {
      setError("Debes ingresar un correo electrónico o nombre de usuario.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(
        "/project-members",
        {
          project_id: projectId,
          user_identifier: userIdentifier.trim(),
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSuccess("Miembro agregado exitosamente 🎉");
      setUserIdentifier("");
      setRole("Member");

      // Notificar al componente padre sobre el éxito
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al agregar miembro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="add-member-modal-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="add-member-modal dark-theme">
        <div className="add-member-modal-dialog">
          <div className="add-member-modal-content">
            {/* Header */}
            <div className="add-member-modal-header">
              <div className="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <h3 className="add-member-modal-title">Añadir Miembro al Proyecto</h3>
              <button className="add-member-modal-close" onClick={onClose}>
                ×
              </button>
            </div>

            {/* Body */}
            <div className="add-member-modal-body">
              {success ? (
                <div className="success-container">
                  <div className="success-icon">✓</div>
                  <h4>¡Miembro agregado exitosamente!</h4>
                  <p>El miembro se ha añadido al proyecto correctamente.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="add-member-form">
                  <div className={`form-group ${activeField === 'userIdentifier' ? 'active' : ''}`}>
                    <label htmlFor="userIdentifier">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Correo electrónico o nombre de usuario *
                    </label>
                    <input
                      id="userIdentifier"
                      type="text"
                      className="form-control"
                      value={userIdentifier}
                      onChange={(e) => setUserIdentifier(e.target.value)}
                      onFocus={() => handleFocus('userIdentifier')}
                      onBlur={handleBlur}
                      placeholder="ej. juan@email.com o juan123"
                      required
                    />
                    <div className="input-highlight"></div>
                  </div>

                  <div className={`form-group ${activeField === 'role' ? 'active' : ''}`}>
                    <label htmlFor="role">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Rol en el proyecto
                    </label>
                    <select
                      id="role"
                      className="form-control"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      onFocus={() => handleFocus('role')}
                      onBlur={handleBlur}
                    >
                      {roles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <div className="input-highlight"></div>
                  </div>

                  {error && (
                    <div className="alert alert-danger">
                      <div className="alert-icon">⚠️</div>
                      <span>{error}</span>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="add-member-modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  onClick={handleSubmit} 
                  disabled={loading || !userIdentifier.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-sm"></span>
                      Añadiendo...
                    </>
                  ) : (
                    'Añadir Miembro'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AddMemberModal;