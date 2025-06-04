import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "./EditProjectModal.css";

interface Proyecto {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  owner_id: number;
}

interface EditProjectModalProps {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: "Active", label: "Activo" },
  { value: "Inactive", label: "Inactivo" },
  { value: "Completed", label: "Completado" },
  { value: "On Hold", label: "En Pausa" }
];

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const [_proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState("");

  // Estados para los campos del formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Cargar los datos del proyecto
  useEffect(() => {
    const fetchProyecto = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        const data = res.data;
        setProyecto(data);
        
        // Inicializar los estados del formulario
        setName(data.name || "");
        setDescription(data.description || "");
        setStatus(data.status || "Active");
        
        // Formatear fechas para input type="date"
        if (data.startDate) {
          const formattedStartDate = new Date(data.startDate).toISOString().split('T')[0];
          setStartDate(formattedStartDate);
        }
        
        if (data.endDate) {
          const formattedEndDate = new Date(data.endDate).toISOString().split('T')[0];
          setEndDate(formattedEndDate);
        }
        
      } catch (error) {
        console.error("Error cargando proyecto:", error);
        setError("No se pudo cargar la información del proyecto");
      } finally {
        setLoading(false);
      }
    };

    fetchProyecto();
  }, [projectId]);

  // Manejar focus de campos
  const handleFocus = (fieldName: string) => {
    setActiveField(fieldName);
  };

  const handleBlur = () => {
    setActiveField("");
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updatedData: any = {
        name,
        description,
        status,
      };

      // Solo incluir fechas si tienen valor
      if (startDate) {
        updatedData.startDate = startDate;
      }

      if (endDate) {
        updatedData.endDate = endDate;
      }

      await api.patch(`/projects/${projectId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Mostrar éxito y cerrar modal
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error actualizando proyecto:", error);
      setError(
        error.response?.data?.message || 
        "Ocurrió un error al actualizar el proyecto. Por favor, intenta de nuevo."
      );
    } finally {
      setSaving(false);
    }
  };

  // Validar fechas al cambiar
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio");
    } else {
      setError(null);
    }
    
    setEndDate(newEndDate);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    
    if (endDate && newStartDate && new Date(newStartDate) > new Date(endDate)) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin");
    } else {
      setError(null);
    }
    
    setStartDate(newStartDate);
  };

  if (loading) {
    return (
      <>
        <div className="edit-project-modal-backdrop" />
        <div className="edit-project-modal dark-theme">
          <div className="edit-project-modal-dialog">
            <div className="edit-project-modal-content">
              <div className="loading-container">
                <div className="spinner-border"></div>
                <p>Cargando información del proyecto...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="edit-project-modal-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="edit-project-modal dark-theme">
        <div className="edit-project-modal-dialog">
          <div className="edit-project-modal-content">
            {/* Header */}
            <div className="edit-project-modal-header">
              <div className="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h2 className="edit-project-modal-title">Editar Proyecto</h2>
              <button className="edit-project-modal-close" onClick={onClose}>
                ×
              </button>
            </div>

            {/* Body */}
            <div className="edit-project-modal-body">
              <form onSubmit={handleSubmit} className="edit-project-form">
                {error && (
                  <div className="alert alert-danger">
                    <div className="alert-icon">⚠️</div>
                    <span>{error}</span>
                  </div>
                )}

                <div className={`form-group ${activeField === 'name' ? 'active' : ''}`}>
                  <label htmlFor="name">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    Nombre del Proyecto *
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => handleFocus('name')}
                    onBlur={handleBlur}
                    required
                    placeholder="Nombre del proyecto"
                  />
                  <div className="input-highlight"></div>
                </div>

                <div className={`form-group ${activeField === 'description' ? 'active' : ''}`}>
                  <label htmlFor="description">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => handleFocus('description')}
                    onBlur={handleBlur}
                    placeholder="Describe tu proyecto"
                    rows={3}
                  />
                  <div className="input-highlight"></div>
                </div>

                <div className={`form-group ${activeField === 'status' ? 'active' : ''}`}>
                  <label htmlFor="status">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                    Estado
                  </label>
                  <select
                    id="status"
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    onFocus={() => handleFocus('status')}
                    onBlur={handleBlur}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="input-highlight"></div>
                </div>

                <div className="form-row">
                  <div className={`form-group form-group-half ${activeField === 'startDate' ? 'active' : ''}`}>
                    <label htmlFor="startDate">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      className="form-control"
                      value={startDate}
                      onChange={handleStartDateChange}
                      onFocus={() => handleFocus('startDate')}
                      onBlur={handleBlur}
                    />
                    <div className="input-highlight"></div>
                  </div>

                  <div className={`form-group form-group-half ${activeField === 'endDate' ? 'active' : ''}`}>
                    <label htmlFor="endDate">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                        <path d="M9 16l2 2 4-4"/>
                      </svg>
                      Fecha de Finalización
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      className="form-control"
                      value={endDate}
                      onChange={handleEndDateChange}
                      onFocus={() => handleFocus('endDate')}
                      onBlur={handleBlur}
                    />
                    <div className="input-highlight"></div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="edit-project-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving || !!error || !name.trim()}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-sm"></span>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProjectModal;