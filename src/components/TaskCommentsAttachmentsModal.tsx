import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './TaskCommentsAttachmentsModal.css';

interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  };
}

interface Attachment {
  id: number;
  task_id: number;
  user_id: number;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  };
}

interface Task {
  id: number;
  title: string;
  project?: {
    id: number;
    name: string;
  };
}

interface TaskCommentsAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  taskTitle?: string;
  onCommentAdded?: () => void;
  onAttachmentAdded?: () => void;
  theme?: 'light' | 'dark';
}

const TaskCommentsAttachmentsModal: React.FC<TaskCommentsAttachmentsModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskTitle = 'Tarea',
  onCommentAdded,
  onAttachmentAdded,
  theme = 'dark'
}) => {
  // Estados
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  
  // Estados para edición y eliminación
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>('');
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'comment' | 'attachment', id: number, name?: string} | null>(null);

  // Obtener el usuario del localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id || 0;

  // Cargar datos cuando se abre el modal y cambia el taskId
  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskData();
    } else {
      // Limpiar estados cuando se cierra el modal
      setComments([]);
      setAttachments([]);
      setTask(null);
      setNewComment('');
      setSelectedFile(null);
      setError(null);
      setShowSuccessMessage(false);
    }
  }, [isOpen, taskId]);

  // Cargar datos de la tarea, comentarios y adjuntos
  const loadTaskData = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Primero obtener detalles de la tarea
      const taskResponse = await api.get(`/tasks/${taskId}`);
      setTask(taskResponse.data);
      
      // Luego obtener comentarios y adjuntos en una sola llamada
      try {
        const response = await api.get(`/comments/task/${taskId}/all`);
        
        setComments(response.data.comments || []);
        setAttachments(response.data.attachments || []);
      } catch (err) {
        console.error('Error al cargar comentarios y adjuntos:', err);
        
        // Intentar cargar comentarios y adjuntos por separado
        try {
          const commentsResponse = await api.get(`/comments/task/${taskId}`);
          setComments(commentsResponse.data || []);
        } catch (commErr) {
          console.error('Error al cargar comentarios:', commErr);
        }
        
        try {
          const attachmentsResponse = await api.get(`/comments/attachments/task/${taskId}`);
          setAttachments(attachmentsResponse.data || []);
        } catch (attachErr) {
          console.error('Error al cargar adjuntos:', attachErr);
        }
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudieron cargar los comentarios y archivos adjuntos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío de comentario
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskId || !newComment.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const commentData = {
        task_id: taskId,
        user_id: userId,
        content: newComment.trim()
      };
      
      const response = await api.post('/comments', commentData);
      
      // Añadir el nuevo comentario a la lista
      setComments(prevComments => [response.data, ...prevComments]);
      setNewComment('');
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Comentario añadido correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Ejecutar callback si existe
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Error al añadir comentario:', err);
      setError('Error al añadir comentario. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar carga de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Función mejorada para obtener una URL de descarga limpia
  const getDownloadUrl = (url: string, attachment: Attachment): string => {
    if (!url) return '';
    
    // Extraer extensión del archivo del nombre original
    const fileExtension = attachment.originalName.split('.').pop() || '';
    
    // Para las URLs de Cloudinary raw
    if (url.includes('cloudinary.com/') && url.includes('/raw/upload/')) {
      // Las URLs de tipo raw pueden requerir ajustes especiales
      return url;
    }
    
    // Para las URLs de Cloudinary normales (imágenes, etc.)
    if (url.includes('cloudinary.com/')) {
      const separator = url.includes('?') ? '&' : '?';
      // Forzar la descarga con el nombre de archivo original
      return `${url}${separator}fl_attachment=true&attachment=${encodeURIComponent(attachment.originalName)}`;
    }
    
    return url;
  };

  // Método mejorado para ver archivos
  const handleFileView = (attachment: Attachment) => {
    // Para archivos PDF y documentos
    if (
      attachment.mimeType.includes('pdf') ||
      attachment.mimeType.includes('word') ||
      attachment.mimeType.includes('excel') ||
      attachment.mimeType.includes('powerpoint') ||
      attachment.mimeType.includes('msword') ||
      attachment.mimeType.includes('officedocument')
    ) {
      // En lugar de abrir en una nueva ventana, descargamos el archivo
      handleDownloadFile(attachment);
    } else {
      // Para imágenes y otros archivos que se pueden visualizar
      window.open(attachment.path, '_blank');
    }
  };

  // Método mejorado para forzar la descarga
  const handleDownloadFile = (attachment: Attachment) => {
    // Determinar el tipo MIME para ver si debemos usar un enfoque especial
    const isPdfOrDocument = 
      attachment.mimeType.includes('pdf') ||
      attachment.mimeType.includes('word') ||
      attachment.mimeType.includes('excel') ||
      attachment.mimeType.includes('powerpoint') ||
      attachment.mimeType.includes('msword') ||
      attachment.mimeType.includes('officedocument');
    
    if (isPdfOrDocument) {
      // Para documentos, usamos fetch para la descarga controlada
      setDownloadLoading(true);
      
      fetch(attachment.path)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = attachment.originalName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        })
        .catch(error => {
          console.error('Error al descargar el archivo:', error);
          setError('Error al descargar el archivo. Intente de nuevo.');
        })
        .finally(() => {
          setDownloadLoading(false);
        });
    } else {
      // Para otros tipos de archivos, uso simplificado
      const downloadUrl = getDownloadUrl(attachment.path, attachment);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = attachment.originalName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Manejar edición de comentario
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  // Cancelar edición de comentario
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // Guardar comentario editado
  const handleSaveEditComment = async (commentId: number) => {
    if (!editCommentText.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.patch(`/comments/${commentId}`, {
        content: editCommentText.trim()
      });
      
      // Actualizar el comentario en la lista
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: editCommentText.trim(), updatedAt: response.data.updatedAt || new Date().toISOString() }
            : comment
        )
      );
      
      // Resetear estado de edición
      setEditingCommentId(null);
      setEditCommentText('');
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Comentario actualizado correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error al editar comentario:', err);
      setError('Error al editar el comentario. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar confirmación de eliminación
  const showDeleteConfirmation = (type: 'comment' | 'attachment', id: number, name?: string) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteConfirm(true);
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'comment') {
      await executeDeleteComment(deleteTarget.id);
    } else {
      await executeDeleteAttachment(deleteTarget.id);
    }

    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Eliminar comentario (función interna)
  const executeDeleteComment = async (commentId: number) => {
    try {
      setDeletingCommentId(commentId);
      setError(null);
      
      await api.delete(`/comments/${commentId}`);
      
      // Remover el comentario de la lista
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Comentario eliminado correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
      setError('Error al eliminar el comentario. Por favor, inténtalo de nuevo.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Eliminar comentario (función pública)
  const handleDeleteComment = (commentId: number) => {
    showDeleteConfirmation('comment', commentId, 'este comentario');
  };

  // Eliminar archivo adjunto (función interna)
  const executeDeleteAttachment = async (attachmentId: number) => {
    try {
      setDeletingAttachmentId(attachmentId);
      setError(null);
      
      await api.delete(`/comments/attachments/${attachmentId}`);
      
      // Remover el archivo de la lista
      setAttachments(prevAttachments => 
        prevAttachments.filter(attachment => attachment.id !== attachmentId)
      );
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Archivo eliminado correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Error al eliminar archivo:', err);
      setError('Error al eliminar el archivo. Por favor, inténtalo de nuevo.');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  // Eliminar archivo adjunto (función pública)
  const handleDeleteAttachment = (attachmentId: number, fileName: string) => {
    showDeleteConfirmation('attachment', attachmentId, fileName);
  };
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskId || !selectedFile) return;
    
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);
      
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Configurar opciones para seguimiento de progreso
      const uploadConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };
      
      // Subir el archivo a Cloudinary usando nuestro endpoint personalizado
      // Usamos el endpoint específico de tareas para organizar por tarea
      const uploadResponse = await api.post(`/upload/task/${taskId}`, formData, uploadConfig);
      
      // Crear el registro de archivo adjunto en nuestra base de datos
      const attachmentData = {
        task_id: taskId,
        user_id: userId,
        filename: uploadResponse.data.filename,
        originalName: uploadResponse.data.originalName,
        path: uploadResponse.data.path,
        mimeType: uploadResponse.data.mimeType,
        size: uploadResponse.data.size
      };
      
      const response = await api.post('/comments/attachments', attachmentData);
      
      // Añadir el archivo a la lista
      setAttachments(prevAttachments => [response.data, ...prevAttachments]);
      
      // Resetear el formulario
      setSelectedFile(null);
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Archivo adjunto añadido correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Ejecutar callback si existe
      if (onAttachmentAdded) onAttachmentAdded();
      
      // Resetear el input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error al subir archivo:', err);
      setError('Error al subir el archivo. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Formatear fecha
  const formatDateTime = (dateString: string): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Obtener nombre de usuario
  const getUserName = (user: any): string => {
    if (!user) return 'Usuario desconocido';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.username) {
      return user.username;
    }
    
    return `Usuario #${user.id}`;
  };

  // Obtener iniciales del usuario para el avatar
  const getUserInitials = (user: any): string => {
    if (!user) return '?';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    return '?';
  };

  // Obtener color de avatar basado en el ID del usuario
  const getUserAvatarColor = (userId: number): string => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
      '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
    ];
    
    return colors[userId % colors.length];
  };

  // Obtener icono según el tipo de archivo
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
    if (mimeType.includes('compressed') || mimeType.includes('zip')) return '🗜️';
    return '📎';
  };

  // Renderizar tarjeta de archivo adjunto 
  const renderAttachmentCard = (attachment: Attachment) => (
    <div key={attachment.id} className="attachment-card">
      <div className="attachment-card-body">
        <div className="attachment-content">
          <div className="file-icon">
            {getFileIcon(attachment.mimeType)}
          </div>
          <div className="attachment-info">
            <div className="attachment-header">
              <h6 className="attachment-filename">
                {attachment.originalName}
              </h6>
              <span className="file-size-badge">
                {formatFileSize(attachment.size)}
              </span>
            </div>
            <div className="attachment-footer">
              <small className="attachment-meta">
                Subido por {getUserName(attachment.user)} {' '} 
                {formatDateTime(attachment.createdAt)}
              </small>
              <div className="attachment-actions">
                {/* Para PDFs y documentos, el botón Ver ahora llama a la misma función que Descargar */}
                {attachment.mimeType.includes('pdf') || 
                attachment.mimeType.includes('word') || 
                attachment.mimeType.includes('excel') || 
                attachment.mimeType.includes('msword') || 
                attachment.mimeType.includes('officedocument') ? (
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleDownloadFile(attachment)}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? 'Procesando...' : 'Ver / Descargar'}
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => window.open(attachment.path, '_blank')}
                    >
                      Ver
                    </button>
                    <button 
                      className="btn btn-outline-success btn-sm"
                      onClick={() => handleDownloadFile(attachment)}
                      disabled={downloadLoading}
                    >
                      Descargar
                    </button>
                  </>
                )}
                
                {/* Botón de eliminar - solo si es el propietario del archivo o admin */}
                {(attachment.user_id === userId) && (
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteAttachment(attachment.id, attachment.originalName)}
                    disabled={deletingAttachmentId === attachment.id}
                    title="Eliminar archivo"
                  >
                    {deletingAttachmentId === attachment.id ? (
                      <>
                        <span className="spinner-border spinner-sm"></span>
                        Eliminando...
                      </>
                    ) : (
                      <>🗑️ Eliminar</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar contenido basado en la pestaña activa
  const renderTabContent = () => {
    if (loading && !comments.length && !attachments.length) {
      return (
        <div className="loading-container">
          <div className="spinner-border"></div>
          <p>Cargando datos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          <div className="alert-header">
            <h5>Error</h5>
          </div>
          <p>{error}</p>
          <div className="alert-actions">
            <button className="btn btn-outline-danger" onClick={loadTaskData}>
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'comments' || activeTab === 'all') {
      return (
        <div className={`comments-section ${activeTab === 'all' ? 'mb-4' : ''}`}>
          {activeTab === 'all' && <h5 className="section-title">Comentarios</h5>}
          
          {!loading && comments.length === 0 ? (
            <div className="empty-state">
              <p>No hay comentarios para esta tarea.</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-card-body">
                    <div className="comment-content">
                      <div 
                        className="user-avatar"
                        style={{ 
                          backgroundColor: getUserAvatarColor(comment.user.id)
                        }}
                      >
                        {getUserInitials(comment.user)}
                      </div>
                      <div className="comment-details">
                        <div className="comment-header">
                          <h6 className="comment-user">{getUserName(comment.user)}</h6>
                          <div className="comment-actions">
                            <small className="comment-date">{formatDateTime(comment.createdAt)}</small>
                            {comment.user_id === userId && (
                              <div className="comment-buttons">
                                {editingCommentId === comment.id ? (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => handleSaveEditComment(comment.id)}
                                      disabled={loading || !editCommentText.trim()}
                                    >
                                      ✓ Guardar
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={handleCancelEditComment}
                                      disabled={loading}
                                    >
                                      ✕ Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleEditComment(comment)}
                                      disabled={loading}
                                      title="Editar comentario"
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      disabled={deletingCommentId === comment.id}
                                      title="Eliminar comentario"
                                    >
                                      {deletingCommentId === comment.id ? (
                                        <span className="spinner-border spinner-sm"></span>
                                      ) : '🗑️'}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {editingCommentId === comment.id ? (
                          <textarea
                            className="form-control edit-comment-textarea"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            disabled={loading}
                            rows={3}
                          />
                        ) : (
                          <p className="comment-text">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSubmitComment} className="comment-form">
            <div className="form-group">
              <textarea
                className="form-control"
                rows={3}
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-actions">
              <button 
                className="btn btn-primary"
                type="submit" 
                disabled={!newComment.trim() || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-sm"></span>
                    Enviando...
                  </>
                ) : 'Enviar comentario'}
              </button>
            </div>
          </form>
        </div>
      );
    }

    if (activeTab === 'attachments') {
      return (
        <div className="attachments-section">
          {!loading && attachments.length === 0 ? (
            <div className="empty-state">
              <p>No hay archivos adjuntos para esta tarea.</p>
            </div>
          ) : (
            <div className="attachments-list">
              {attachments.map(attachment => renderAttachmentCard(attachment))}
            </div>
          )}
          
          <form onSubmit={handleUploadFile} className="upload-form">
            <div className="form-group">
              <input
                type="file"
                id="fileInput"
                className="form-control"
                onChange={handleFileChange}
                disabled={loading}
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="progress">
                  <div 
                    className="progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button 
                className="btn btn-primary"
                type="submit" 
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-sm"></span>
                    Subiendo...
                  </>
                ) : 'Subir archivo'}
              </button>
            </div>
          </form>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div className="comments-modal-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="comments-modal dark-theme">
        <div className="comments-modal-dialog">
          <div className="comments-modal-content">
            {/* Header */}
            <div className="comments-modal-header">
              <div className="comments-modal-title">
                <span className="title-icon">💬</span>
                <span>Comentarios y Archivos - {task?.title || taskTitle}</span>
              </div>
              <button 
                className="comments-modal-close"
                onClick={onClose}
              >
                ×
              </button>
            </div>
            
            {/* Body */}
            <div className="comments-modal-body">
              {showSuccessMessage && (
                <div className="alert alert-success">
                  {successMessage}
                </div>
              )}
              
              {/* Tabs */}
              <div className="tabs-container">
                <div className="tabs-nav">
                  <button 
                    className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    Todos
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comments')}
                  >
                    Comentarios
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attachments')}
                  >
                    Archivos
                  </button>
                </div>
                
                <div className="tab-content">
                  {renderTabContent()}
                  {activeTab === 'all' && (
                    <>
                      <h5 className="section-title">Archivos Adjuntos</h5>
                      {!loading && attachments.length === 0 ? (
                        <div className="empty-state">
                          <p>No hay archivos adjuntos para esta tarea.</p>
                        </div>
                      ) : (
                        <div className="attachments-list">
                          {attachments.map(attachment => renderAttachmentCard(attachment))}
                        </div>
                      )}
                      
                      <form onSubmit={handleUploadFile} className="upload-form">
                        <div className="form-group">
                          <input
                            type="file"
                            id="fileInput"
                            className="form-control"
                            onChange={handleFileChange}
                            disabled={loading}
                          />
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="progress">
                              <div 
                                className="progress-bar"
                                style={{ width: `${uploadProgress}%` }}
                              >
                                {uploadProgress}%
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="form-actions">
                          <button 
                            className="btn btn-primary"
                            type="submit" 
                            disabled={!selectedFile || loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-sm"></span>
                                Subiendo...
                              </>
                            ) : 'Subir archivo'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="comments-modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación personalizado */}
      {showDeleteConfirm && deleteTarget && (
        <>
          <div className="delete-confirm-backdrop" onClick={cancelDelete} />
          <div className="delete-confirm-modal">
            <div className="delete-confirm-content">
              <div className="delete-confirm-header">
                <h3>Confirmar eliminación</h3>
              </div>
              <div className="delete-confirm-body">
                <p>
                  ¿Estás seguro de que deseas eliminar{' '}
                  {deleteTarget.type === 'comment' ? 'este comentario' : `el archivo "${deleteTarget.name}"`}?
                </p>
                <p className="delete-warning">Esta acción no se puede deshacer.</p>
              </div>
              <div className="delete-confirm-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={cancelDelete}
                  disabled={deletingCommentId !== null || deletingAttachmentId !== null}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deletingCommentId !== null || deletingAttachmentId !== null}
                >
                  {(deletingCommentId !== null || deletingAttachmentId !== null) ? (
                    <>
                      <span className="spinner-border spinner-sm"></span>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TaskCommentsAttachmentsModal;