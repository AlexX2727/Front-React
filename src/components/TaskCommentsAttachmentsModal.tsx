import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Tabs, Tab, Alert, Spinner, Card, Badge } from 'react-bootstrap';
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

  // Manejar subida de archivo
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
    <Card key={attachment.id} className={`attachment-card mb-3 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
      <Card.Body className="p-3">
        <div className="d-flex align-items-center">
          <div 
            className="file-icon mr-3"
            style={{ 
              fontSize: '24px',
              marginRight: '15px'
            }}
          >
            {getFileIcon(attachment.mimeType)}
          </div>
          <div className="attachment-info" style={{ flex: 1 }}>
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 font-weight-bold" style={{ wordBreak: 'break-word' }}>
                {attachment.originalName}
              </h6>
              <Badge 
                bg={theme === 'dark' ? 'light' : 'secondary'}
                className="ml-2"
              >
                {formatFileSize(attachment.size)}
              </Badge>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted">
                Subido por {getUserName(attachment.user)} {' '} 
                {formatDateTime(attachment.createdAt)}
              </small>
              <div>
                {/* Para PDFs y documentos, el botón Ver ahora llama a la misma función que Descargar */}
                {attachment.mimeType.includes('pdf') || 
                attachment.mimeType.includes('word') || 
                attachment.mimeType.includes('excel') || 
                attachment.mimeType.includes('msword') || 
                attachment.mimeType.includes('officedocument') ? (
                  <Button 
                    variant={theme === 'dark' ? 'outline-light' : 'outline-primary'} 
                    size="sm"
                    className="me-2"
                    onClick={() => handleDownloadFile(attachment)}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? 'Procesando...' : 'Ver / Descargar'}
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant={theme === 'dark' ? 'outline-light' : 'outline-primary'} 
                      size="sm"
                      className="me-2"
                      onClick={() => window.open(attachment.path, '_blank')}
                    >
                      Ver
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'outline-success' : 'outline-success'} 
                      size="sm"
                      onClick={() => handleDownloadFile(attachment)}
                      disabled={downloadLoading}
                    >
                      Descargar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // Renderizar contenido basado en la pestaña activa
  const renderTabContent = () => {
    if (loading && !comments.length && !attachments.length) {
      return (
        <div className="text-center p-4">
          <Spinner animation="border" variant={theme === 'dark' ? 'light' : 'primary'} />
          <p className="mt-3">Cargando datos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="mt-3">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={loadTaskData}>
              Reintentar
            </Button>
          </div>
        </Alert>
      );
    }

    if (activeTab === 'comments' || activeTab === 'all') {
      return (
        <div className={`comments-section ${activeTab === 'all' ? 'mb-4' : ''}`}>
          {activeTab === 'all' && <h5 className="section-title">Comentarios</h5>}
          
          {!loading && comments.length === 0 ? (
            <div className="text-center p-3 empty-state">
              <p className="mb-0">No hay comentarios para esta tarea.</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <Card key={comment.id} className={`comment-card mb-3 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
                  <Card.Body className="p-3">
                    <div className="d-flex">
                      <div 
                        className="user-avatar mr-3"
                        style={{ 
                          backgroundColor: getUserAvatarColor(comment.user.id), 
                          width: '40px', 
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          marginRight: '15px'
                        }}
                      >
                        {getUserInitials(comment.user)}
                      </div>
                      <div className="comment-content" style={{ flex: 1 }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0 font-weight-bold">{getUserName(comment.user)}</h6>
                          <small className="text-muted">{formatDateTime(comment.createdAt)}</small>
                        </div>
                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
          
          <Form onSubmit={handleSubmitComment} className="mt-3">
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={loading}
                className={theme === 'dark' ? 'bg-dark text-light' : ''}
              />
            </Form.Group>
            <div className="d-flex justify-content-end mt-2">
              <Button 
                variant={theme === 'dark' ? 'light' : 'primary'} 
                type="submit" 
                disabled={!newComment.trim() || loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="mr-2" />
                    Enviando...
                  </>
                ) : 'Enviar comentario'}
              </Button>
            </div>
          </Form>
        </div>
      );
    }

    if (activeTab === 'attachments') {
      return (
        <div className="attachments-section">
          {!loading && attachments.length === 0 ? (
            <div className="text-center p-3 empty-state">
              <p className="mb-0">No hay archivos adjuntos para esta tarea.</p>
            </div>
          ) : (
            <div className="attachments-list">
              {attachments.map(attachment => renderAttachmentCard(attachment))}
            </div>
          )}
          
          <Form onSubmit={handleUploadFile} className="mt-3">
            <Form.Group>
              <Form.Control
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                disabled={loading}
                className={theme === 'dark' ? 'bg-dark text-light' : ''}
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="progress mt-2">
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${uploadProgress}%` }} 
                    aria-valuenow={uploadProgress} 
                    aria-valuemin={0} 
                    aria-valuemax={100}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </Form.Group>
            <div className="d-flex justify-content-end mt-2">
              <Button 
                variant={theme === 'dark' ? 'light' : 'primary'} 
                type="submit" 
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="mr-2" />
                    Subiendo...
                  </>
                ) : 'Subir archivo'}
              </Button>
            </div>
          </Form>
        </div>
      );
    }

    return null;
  };

  const modalClasses = theme === 'dark' ? 'bg-dark text-light' : '';
  
  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      size="lg"
      className={`task-comments-modal ${theme === 'dark' ? 'dark-theme' : ''}`}
    >
      <Modal.Header closeButton className={modalClasses}>
        <Modal.Title>
          <div className="d-flex align-items-center">
            <span className="mr-2">💬</span>
            <span>Comentarios y Archivos - {task?.title || taskTitle}</span>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={modalClasses} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {showSuccessMessage && (
          <Alert variant="success" className="mb-3">
            {successMessage}
          </Alert>
        )}
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'all')}
          id="comments-attachments-tabs"
          className="mb-3"
        >
          <Tab eventKey="all" title="Todos">
            {renderTabContent()}
            {activeTab === 'all' && (
              <>
                <h5 className="section-title mt-4">Archivos Adjuntos</h5>
                {!loading && attachments.length === 0 ? (
                  <div className="text-center p-3 empty-state">
                    <p className="mb-0">No hay archivos adjuntos para esta tarea.</p>
                  </div>
                ) : (
                  <div className="attachments-list">
                    {attachments.map(attachment => renderAttachmentCard(attachment))}
                  </div>
                )}
                
                <Form onSubmit={handleUploadFile} className="mt-3">
                  <Form.Group>
                    <Form.Control
                      type="file"
                      id="fileInput"
                      onChange={handleFileChange}
                      disabled={loading}
                      className={theme === 'dark' ? 'bg-dark text-light' : ''}
                    />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="progress mt-2">
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{ width: `${uploadProgress}%` }} 
                          aria-valuenow={uploadProgress} 
                          aria-valuemin={0} 
                          aria-valuemax={100}
                        >
                          {uploadProgress}%
                        </div>
                      </div>
                    )}
                  </Form.Group>
                  <div className="d-flex justify-content-end mt-2">
                    <Button 
                      variant={theme === 'dark' ? 'light' : 'primary'} 
                      type="submit" 
                      disabled={!selectedFile || loading}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="mr-2" />
                          Subiendo...
                        </>
                      ) : 'Subir archivo'}
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </Tab>
          <Tab eventKey="comments" title="Comentarios">
            {renderTabContent()}
          </Tab>
          <Tab eventKey="attachments" title="Archivos">
            {renderTabContent()}
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer className={modalClasses}>
        <Button variant={theme === 'dark' ? 'outline-light' : 'secondary'} onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskCommentsAttachmentsModal;