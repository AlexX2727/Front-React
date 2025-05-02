import { useState } from "react";
import api from "../api/axios";
import "./AddMemberModal.css"; // Asegúrate de importar el CSS

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

  // Evitar que los clics dentro del modal se propaguen al overlay
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Manejar tecla Escape para cerrar modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al agregar miembro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-container" onClick={handleModalClick}>
        <div className="modal-header">
          <h3 className="modal-title">Añadir Miembro al Proyecto</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="add-member-form">
            <div className="form-group">
              <label htmlFor="userIdentifier">Correo electrónico o nombre de usuario:</label>
              <input
                id="userIdentifier"
                type="text"
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                placeholder="ej. juan@email.com o juan123"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Rol:</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="message error-message">{error}</div>}
            {success && (
              <div className="message success-message">
                <span>✓</span> {success}
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Cancelar
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? "Añadiendo..." : "Añadir Miembro"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddMemberModal;