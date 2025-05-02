import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios"; // Ajusta esta ruta si usas otra

const roles = [
  { label: "Miembro", value: "Member" },
  { label: "Líder", value: "Leader" },
  { label: "Colaborador", value: "Collaborator" },
  { label: "Observador", value: "Observer" },
  { label: "Gerente de Proyecto", value: "ProjectManager" },
];

function AñadirMiembroPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [userIdentifier, setUserIdentifier] = useState("");
  const [role, setRole] = useState("Member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          project_id: Number(projectId),
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

      setTimeout(() => {
        navigate(-1); // Regresa a la página anterior
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al agregar miembro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Añadir Miembro al Proyecto</h2>

      <form onSubmit={handleSubmit} className="form">
        <label>Correo electrónico o nombre de usuario:</label>
        <input
          type="text"
          value={userIdentifier}
          onChange={(e) => setUserIdentifier(e.target.value)}
          placeholder="ej. juan@email.com o juan123"
        />

        <label>Rol:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" disabled={loading} className="btn">
          {loading ? "Añadiendo..." : "Añadir Miembro"}
        </button>

        <button
          type="button"
          className="btn btn-cancel"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default AñadirMiembroPage;
