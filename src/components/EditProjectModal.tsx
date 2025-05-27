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

const STATUS_OPTIONS = ["Active", "Inactive", "Completed", "On Hold"];

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          // Asegurar que la fecha está en formato YYYY-MM-DD para el input
          const formattedStartDate = new Date(data.startDate).toISOString().split('T')[0];
          setStartDate(formattedStartDate);
        }
        
        if (data.endDate) {
          // Asegurar que la fecha está en formato YYYY-MM-DD para el input
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

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Preparar los datos para enviar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedData: any = {
        name,
        description,
        status,
      };

      // Solo incluir fechas si tienen valor
      if (startDate) {
        // Convertir a formato ISO para el backend
        updatedData.startDate = startDate;
      }

      if (endDate) {
        // Convertir a formato ISO para el backend
        updatedData.endDate = endDate;
      }

      // Llamar a la API para actualizar el proyecto
      await api.patch(`/projects/${projectId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Notificar éxito y cerrar modal
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    
    // Validar que la fecha de fin no sea anterior a la de inicio
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio");
    } else {
      setError(null);
    }
    
    setEndDate(newEndDate);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    
    // Validar que la fecha de inicio no sea posterior a la de fin
    if (endDate && newStartDate && new Date(newStartDate) > new Date(endDate)) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin");
    } else {
      setError(null);
    }
    
    setStartDate(newStartDate);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-loading">
            <div className="loader"></div>
            <p>Cargando información del proyecto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Proyecto</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-project-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Nombre del Proyecto*</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nombre del proyecto"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu proyecto"
              className="form-control"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-control"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="startDate">Fecha de Inicio</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                className="form-control"
              />
            </div>

            <div className="form-group half">
              <label htmlFor="endDate">Fecha de Finalización</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={saving || !!error}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;