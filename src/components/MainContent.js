"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "../context/UserContext" // Импортируем useUser
import { api } from "../utils/api"
import { wsClient } from "../utils/websocket"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faUser,
  faCopy,
  faChevronRight,
  faEdit,
  faTrash,
  faThumbtack,
  faTimes,
  faCamera,
  faLink,
} from "@fortawesome/free-solid-svg-icons"
import styles from "../styles/MainContent.module.css"

// Компонент Comment
function Comment({ comment }) {
  return (
    <div className={styles.comment}>
      <img src={comment.avatar || "/placeholder.svg"} alt={comment.author} className={styles.avatar} />
      <div className={styles.commentContent}>
        <strong className={styles.userName}>{comment.author}</strong>
        <p className={styles.commentText}>{comment.text}</p>
      </div>
    </div>
  )
}

// Добавляем функцию форматирования времени
const formatDateTime = (utcDateString) => {
  try {
    if (!utcDateString) return ""

    // Строка приходит в формате ISO 8601 с UTC
    const date = new Date(utcDateString)
    if (isNaN(date.getTime())) {
      console.error("Invalid date string:", utcDateString)
      return utcDateString
    }

    // Форматируем в локальное время
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error, "for string:", utcDateString)
    return utcDateString
  }
}

// Компонент NewsItem
function NewsItem({ news, onLike, onAddComment, onEdit, onDelete, onPin, isAdmin }) {
  const [commentText, setCommentText] = useState("")
  const comments = news.comments || []

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (commentText.trim()) {
      await onAddComment(news.id, commentText)
      setCommentText("")
    }
  }

  return (
    <div className={`${styles.newsItem} ${news.isPinned ? styles.pinnedNewsItem : ""}`}>
      {news.isPinned && (
        <div className={styles.pinnedIndicator}>
          <FontAwesomeIcon icon={faThumbtack} className={styles.pinnedIcon} />
          <span>Закрепленная новость</span>
        </div>
      )}

      <div className={styles.authorInfo}>
        <div className={styles.authorInfoContainer}>
          <div className={styles.authorAvatar}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
          </div>
          <div className={styles.authorDetails}>
            <strong className={styles.authorName}>{news.isAdminPost ? "Администрация" : news.author_name}</strong>
            <span className={styles.newsTime}>{formatDateTime(news.publication_time)}</span>
          </div>
        </div>

        {isAdmin && (
          <div className={styles.adminActions}>
            <button
              onClick={() => onPin(news.id, !news.isPinned)}
              className={styles.adminActionButton}
              title={news.isPinned ? "Открепить новость" : "Закрепить новость"}
            >
              <FontAwesomeIcon
                icon={news.isPinned ? faTimes : faThumbtack}
                className={styles.adminActionIcon}
                style={{
                  color: news.isPinned ? "#EE6B0C" : "#13454B",
                }}
              />
            </button>
            <button onClick={() => onEdit(news)} className={styles.adminActionButton} title="Редактировать новость">
              <FontAwesomeIcon icon={faEdit} className={styles.adminActionIcon} />
            </button>
            <button onClick={() => onDelete(news.id)} className={styles.adminActionButton} title="Удалить новость">
              <FontAwesomeIcon icon={faTrash} className={styles.adminActionIcon} />
            </button>
          </div>
        )}
      </div>

      <h3 className={styles.newsTitle}>{news.title}</h3>
      <p className={styles.newsDescription}>{news.content}</p>

      {news.image_data && news.image_type && (
        <img
          src={`data:${news.image_type};base64,${news.image_data}`}
          alt={news.title}
          className={styles.newsImage}
          onError={(e) => {
            console.error("Image loading error:", e)
            e.target.style.display = "none"
          }}
        />
      )}

      <div className={styles.newsFooter}>
        <button
          onClick={() => onLike(news.id)}
          className={styles.likeButton}
          aria-label={news.liked ? "Убрать лайк" : "Поставить лайк"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={news.liked ? "#EE6B0C" : "none"}
            stroke="#13454B"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span className={styles.likeCount}>{news.likes_count}</span>
        </button>
      </div>

      <div className={styles.commentsSection}>
        <h4 className={styles.commentsHeader}>Комментарии ({news.comments?.length || 0})</h4>

        {comments.map((comment, index) => (
          <Comment key={index} comment={comment} />
        ))}

        <form onSubmit={handleSubmitComment} className={styles.commentForm}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Написать комментарий..."
            className={styles.commentInput}
          />
          <button type="submit" className={styles.commentSubmit}>
            Отправить
          </button>
        </form>
      </div>
    </div>
  )
}

// Компонент для добавления/редактирования новости
function AddNewsForm({ onAddNews, editingNews, setEditingNews, isAdmin, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [validationError, setValidationError] = useState(false)
  const fileInputRef = useRef(null)
  const { currentUser } = useUser()
  const [showCancelWarning, setShowCancelWarning] = useState(false)

  // Инициализация формы при редактировании
  useEffect(() => {
    if (editingNews) {
      setIsExpanded(true)
      setTitle(editingNews.title || "")
      setDescription(editingNews.content || "")

      // Если у новости есть изображение, устанавливаем предпросмотр
      if (editingNews.image_data && editingNews.image_type) {
        setImagePreview(`data:${editingNews.image_type};base64,${editingNews.image_data}`)
      } else {
        setImagePreview(null)
      }
    }
  }, [editingNews])

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Показываем превью
        setImage(file); // Сохраняем файл для последующей отправки
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
        setValidationError(true);
        return;
    }

    try {
        // Создаем объект с обязательными полями
        const newsData = {
            title: title.trim(),
            content: description.trim(),
            author_id: currentUser.id.toString()
        };

        // Обработка изображения при редактировании
        if (editingNews) {
            if (image) {
                // Если выбрано новое изображение
                const reader = new FileReader();
                const imageBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => {
                        const base64String = reader.result.split(',')[1];
                        resolve(base64String);
                    };
                    reader.readAsDataURL(image);
                });
                newsData.image_data = imageBase64;
                newsData.image_type = image.type;
            } else if (imagePreview === null) {
                // Если изображение было удалено
                newsData.image_data = "null";
                newsData.image_type = "";
            }
            // Если imagePreview есть, но image нет - значит изображение не менялось
        } else {
            // Для новой новости
            if (image) {
                const reader = new FileReader();
                const imageBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => {
                        const base64String = reader.result.split(',')[1];
                        resolve(base64String);
                    };
                    reader.readAsDataURL(image);
                });
                newsData.image_data = imageBase64;
                newsData.image_type = image.type;
            }
        }

        let response;

        if (editingNews) {
            response = await api.put(`/api/news/${editingNews.id}`, newsData);
        } else {
            response = await api.post("/api/news", newsData);
        }

        if (response.ok) {
            const responseData = await response.json();
            console.log("Server response:", responseData);
            
            onAddNews(responseData);
            resetForm();
            setEditingNews(null);

            // Перезагружаем список новостей
            if (onUpdate) {
                await onUpdate();
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save news');
        }
    } catch (error) {
        console.error("Error creating/updating news:", error);
        alert(`Ошибка при ${editingNews ? 'обновлении' : 'создании'} новости: ${error.message}`);
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setImage(null)
    setImagePreview(null)
    setValidationError(false)
    setIsExpanded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleInputClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleAttachClick = (e) => {
    e.preventDefault()
    fileInputRef.current.click()
  }

  const handleCancel = () => {
    if (title.trim() || description.trim() || imagePreview) {
      setShowCancelWarning(true)
    } else {
      if (editingNews) {
        setEditingNews(null)
      }
      resetForm()
    }
  }

  const confirmCancel = () => {
    if (editingNews) {
      setEditingNews(null)
    }
    resetForm()
    setShowCancelWarning(false)
  }

  return (
    <div className={styles.addNewsFormContainer}>
      <form onSubmit={handleSubmit} className={styles.addNewsForm}>
        {showCancelWarning && (
          <div className={styles.cancelWarning}>
            <p>Вы уверены, что хотите отменить? Все несохраненные изменения будут потеряны.</p>
            <div className={styles.cancelWarningButtons}>
              <button onClick={() => setShowCancelWarning(false)} className={styles.cancelWarningBackButton}>
                Вернуться к редактированию
              </button>
              <button onClick={confirmCancel} className={styles.cancelWarningConfirmButton}>
                Да, отменить
              </button>
            </div>
          </div>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onClick={handleInputClick}
          placeholder={isExpanded ? "Заголовок новости" : "Что у вас нового?"}
          className={styles.addNewsInput}
          style={{
            borderColor: validationError && !title.trim() ? "#EE6B0C" : "#e0e0e0",
          }}
        />

        {(isExpanded || editingNews) && (
          <>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Текст новости..."
              className={styles.addNewsTextarea}
              style={{
                borderColor: validationError && !description.trim() ? "#EE6B0C" : "#e0e0e0",
              }}
              rows={3}
            />

            {validationError && (!title.trim() || !description.trim()) && (
              <p className={styles.validationError}>Не все поля заполнены</p>
            )}

            <div className={styles.addNewsActions}>
              <div className={styles.attachmentContainer}>
                <button onClick={handleAttachClick} className={styles.attachButton} type="button">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                  <span className={styles.attachText}>Прикрепить файл</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className={styles.fileInput}
                  accept="image/*"
                />
              </div>
              <div className={styles.formButtons}>
                <button type="button" onClick={handleCancel} className={styles.cancelButton}>
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.publishButton}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#ee6b0c"
                    e.currentTarget.style.color = "#ffffff"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff"
                    e.currentTarget.style.color = "#ee6b0c"
                  }}
                >
                  {editingNews ? "Сохранить" : "Опубликовать"}
                </button>
              </div>
            </div>

            {imagePreview && (
              <div className={styles.imagePreviewContainer}>
                <img src={imagePreview || "/placeholder.svg"} alt="Предпросмотр" className={styles.imagePreview} />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className={styles.removeImageButton}
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  )
}

// Компонент для редактирования портала
function PortalEditModal({ isOpen, onClose, portal, onSave, isNewPortal = false, loadPortals }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [icon, setIcon] = useState("")
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [validationError, setValidationError] = useState(false)
  const modalRef = useRef(null)
  const fileInputRef = useRef(null)
  const [showIconUpload, setShowIconUpload] = useState(false)

  // Инициализация формы при открытии
  useEffect(() => {
    if (isOpen && portal) {
      setName(portal.name || "");
      setDescription(portal.description || "");
      setUrl(portal.url || "");
      
      // Проверяем наличие изображения
      if (portal.icon_data && portal.icon_type) {
        setIconPreview(`data:${portal.icon_type};base64,${portal.icon_data}`);
        setIcon("");  // Очищаем эмодзи если есть изображение
        setIconFile(null);
      } 
      // Проверяем наличие эмодзи
      else if (portal.icon_emoji) {
        setIcon(portal.icon_emoji);  // Устанавливаем существующий эмодзи
        setIconPreview(null);
        setIconFile(null);
      } 
      // Если нет ни изображения, ни эмодзи - устанавливаем дефолтное значение для нового портала
      else if (isNewPortal) {
        setIcon("🔗");
        setIconPreview(null);
        setIconFile(null);
      }
      
      setValidationError(false);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, portal, isNewPortal]);

  // Обработчик клика вне модального окна
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        if (hasUnsavedChanges) {
          setShowExitWarning(true)
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, hasUnsavedChanges, onClose])

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true)
    } else {
      onClose()
    }
  }

  // Обработчик изменения полей
  const handleFieldChange = (setter, value, field) => {
    setter(value)
    setHasUnsavedChanges(true)
  }

  // Обработчик изменения иконки
  const handleIconChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setHasUnsavedChanges(true)
    }
  }

  // Добавляем обработчик изменения изображения
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setHasUnsavedChanges(true);
    }
  };

  const savePortal = async (portalData) => {
    let response;
    try {
        if (isNewPortal) {
            response = await api.post('/api/links', portalData);
        } else {
            response = await api.put(`/api/links/${portal.id}`, portalData);
        }

        if (response.ok) {
            const updatedPortal = await response.json();
            onSave(updatedPortal, isNewPortal);
            onClose();
        } else {
            throw new Error('Failed to save portal');
        }
    } catch (error) {
        console.error('Error saving portal:', error);
        throw error;
    }
  };

  const handleSave = async () => {
    try {
        if (!name.trim() || !url.trim()) {
            setValidationError(true);
            return;
        }

        const portalData = {
            name: name.trim(),
            description: description.trim() || "",
            url: url.trim(),
            icon_emoji: "",
            icon_data: "",
            icon_type: ""
        };

        if (iconFile) {
            const reader = new FileReader();
            const base64Data = await new Promise((resolve) => {
                reader.onloadend = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                };
                reader.readAsDataURL(iconFile);
            });

            portalData.icon_data = base64Data;
            portalData.icon_type = iconFile.type;
            portalData.icon_emoji = "";
        } else if (icon) {
            portalData.icon_emoji = icon;
            portalData.icon_data = "";
            portalData.icon_type = "";
        }

        let response;
        if (isNewPortal) {
            response = await api.post('/api/links', portalData);
        } else {
            response = await api.put(`/api/links/${portal.id}`, portalData);
        }

        if (response.ok) {
            const responseData = await response.json();
            if (responseData.error) {
                throw new Error(responseData.error);
            }
            onSave(responseData, isNewPortal);
            await loadPortals();
            onClose();
        } else {
            const errorData = await response.json();
            console.error('Failed to save portal:', errorData);
        }
    } catch (error) {
        console.error('Error saving portal:', error);
    }
  };

  const handleDelete = async () => {
    if (!portal || !portal.id) return;

    try {
      const response = await api.delete(`/api/links/${portal.id}`);
      if (response.ok) {
        onSave(null, false, true); // добавляем третий параметр isDeleted
        await loadPortals();
        onClose();
      } else {
        throw new Error('Failed to delete portal');
      }
    } catch (error) {
      console.error('Error deleting portal:', error);
    }
  };

  // Обработчик подтверждения выхода без сохранения
  const confirmExit = () => {
    setShowExitWarning(false)
    onClose()
  }

  return isOpen ? (
    <div className={styles.modalOverlay}>
      <div className={styles.portalModal} ref={modalRef}>
        <div className={styles.portalModalHeader}>
          <h2 className={styles.portalModalTitle}>{isNewPortal ? "Добавление портала" : "Редактирование портала"}</h2>
          <button className={styles.closeButton} onClick={handleCloseModal}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.portalModalContent}>
          {/* Блок с иконкой */}
          <div className={styles.portalIconEditContainer}>
            <div
              className={styles.portalIconEdit}
              onMouseEnter={() => setShowIconUpload(true)}
              onMouseLeave={() => setShowIconUpload(false)}
              onClick={() => fileInputRef.current.click()}
            >
              {iconPreview ? (
                <img src={iconPreview} alt="Иконка портала" className={styles.portalIconImage} />
              ) : icon ? (
                <span className={styles.portalIconEmoji}>{icon}</span>
              ) : (
                <span className={styles.portalIconPlaceholder}>🔗</span>
              )}

              <div
                className={styles.photoUploadOverlay}
                style={{
                  opacity: showIconUpload ? 1 : 0,
                }}
              >
                <FontAwesomeIcon icon={faCamera} className={styles.cameraIcon} />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleIconChange}
              style={{ display: "none" }}
              accept="image/*"
            />
            {!iconPreview && (
              <div className={styles.emojiSelector}>
                <p className={styles.emojiLabel}>Или выберите эмодзи:</p>
                <div className={styles.emojiGrid}>
                  {["🔗", "📚", "👥", "🖥️", "📄", "🎓", "📊", "📱", "🔍", "📝"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setIcon(emoji)
                        setIconPreview(null)
                        setIconFile(null)
                        setHasUnsavedChanges(true)
                      }}
                      className={`${styles.emojiButton} ${
                        icon === emoji ? styles.emojiButtonSelected : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Поля формы */}
          <div className={styles.portalFormFields}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Название портала*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleFieldChange(setName, e.target.value, "name")}
                className={styles.formInput}
                style={{
                  borderColor: validationError && !name.trim() ? "#EE6B0C" : "#e0e0e0",
                }}
                placeholder="Введите название портала"
              />
              {validationError && !name.trim() && <p className={styles.fieldError}>Название портала обязательно</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Описание</label>
              <textarea
                value={description}
                onChange={(e) => handleFieldChange(setDescription, e.target.value, "description")}
                className={styles.formTextarea}
                placeholder="Введите описание портала"
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ссылка</label>
              <div className={styles.urlInputContainer}>
                <FontAwesomeIcon icon={faLink} className={styles.urlIcon} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleFieldChange(setUrl, e.target.value, "url")}
                  className={styles.urlInput}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className={styles.portalModalActions}>
            {showExitWarning ? (
              <>
                <div className={styles.warningContainer}>
                  <span className={styles.warningText}>У вас есть несохраненные изменения</span>
                </div>
                <div className={styles.actionButtons}>
                  <button className={styles.cancelButton} onClick={confirmExit}>
                    Выйти без сохранения
                  </button>
                  <button className={styles.cancelButton} onClick={() => setShowExitWarning(false)}>
                    Вернуться к редактированию
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.actionButtons}>
                <button className={styles.cancelButton} onClick={handleCloseModal}>
                  Отмена
                </button>
                {!isNewPortal && ( // Показываем кнопку удаления только при редактировании
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`${styles.deleteButton} ${styles.actionButton}`}
                  >
                    Удалить
                  </button>
                )}
                <button
                  className={styles.saveButton}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#EE6B0C"
                    e.currentTarget.style.color = "#FFFFFF"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFFFFF"
                    e.currentTarget.style.color = "#EE6B0C"
                  }}
                  onClick={handleSave}
                >
                  {isNewPortal ? "Добавить" : "Сохранить"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null
}

// Компонент Event
function Event({ event }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleRegister = (e) => {
    e.stopPropagation()
    setIsRegistered(!isRegistered)
    // Здесь будет логика для регистрации на мероприятие
  }

  return (
    <div className={styles.eventItem}>
      <div className={styles.eventHeader} onClick={toggleExpand}>
        <div className={styles.eventInfo}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <p className={styles.eventShortDescription}>{event.shortDescription}</p>
        </div>
        <div className={styles.eventActions}>
          <button
            className={isRegistered ? styles.registeredButton : styles.registerButton}
            onClick={handleRegister}
            onMouseOver={(e) => {
              if (!isRegistered) {
                e.currentTarget.style.backgroundColor = "#EE6B0C"
                e.currentTarget.style.color = "#FFFFFF"
              }
            }}
            onMouseOut={(e) => {
              if (!isRegistered) {
                e.currentTarget.style.backgroundColor = "#FFFFFF"
                e.currentTarget.style.color = "#EE6B0C"
              }
            }}
          >
            {isRegistered ? "Отменить" : "Записаться"}
          </button>
          <FontAwesomeIcon
            icon={faChevronRight}
            className={styles.expandIcon}
            style={{
              transform: isExpanded ? "rotate(90deg)" : "none",
              transition: "transform 0.3s ease",
            }}
          />
        </div>
      </div>

      {isExpanded && (
        <div className={styles.eventDetails}>
          <p className={styles.eventFullDescription}>{event.fullDescription}</p>

          <div className={styles.eventMetadata}>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Свободных мест:</span>
              <span className={styles.eventMetaValue}>
                {event.availableSeats} из {event.totalSeats}
              </span>
            </div>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Дата:</span>
              <span className={styles.eventMetaValue}>{event.date}</span>
            </div>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Время:</span>
              <span className={styles.eventMetaValue}>{event.time}</span>
            </div>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Место:</span>
              <span className={styles.eventMetaValue}>{event.location}</span>
            </div>
          </div>

          <div className={styles.speakersSection}>
            <h4 className={styles.speakersTitle}>Спикеры:</h4>
            <div className={styles.speakersList}>
              {event.speakers.map((speaker) => (
                <div key={speaker.id} className={styles.speakerItem}>
                  <div className={styles.speakerAvatar}>
                    {speaker.photo ? (
                      <img
                        src={speaker.photo || "/placeholder.svg"}
                        alt={speaker.name}
                        className={styles.speakerPhoto}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
                    )}
                  </div>
                  <div className={styles.speakerInfo}>
                    <p className={styles.speakerName}>{speaker.name}</p>
                    <p className={styles.speakerPosition}>{speaker.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Основной компонент MainContent
function MainContent() {
  const [news, setNews] = useState([])
  const { currentUser, isAdmin } = useUser() // Получаем информацию о роли пользователя

  const [selectedBirthday, setSelectedBirthday] = useState(null)
  const [expandedBirthday, setExpandedBirthday] = useState(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [copiedText, setCopiedText] = useState("")
  const [editingNews, setEditingNews] = useState(null) // Состояние для редактирования
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null) // ID новости для подтверждения удаления

  // Состояния для управления порталами
  const [portals, setPortals] = useState([]);
  const [editingPortal, setEditingPortal] = useState(null)
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false)
  const [isNewPortal, setIsNewPortal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPortalMenu, setShowPortalMenu] = useState(false)

  // Состояния для дней рождения
  const [birthdays, setBirthdays] = useState([]);
  const [isBirthdaysLoading, setIsBirthdaysLoading] = useState(true);

  // Загрузка дней рождения
  useEffect(() => {
    const loadBirthdays = async () => {
      try {
        const data = await api.get('/api/birthdays/upcoming');
        setBirthdays(data);
      } catch (error) {
        console.error('Error loading birthdays:', error);
      } finally {
        setIsBirthdaysLoading(false);
      }
    };

    loadBirthdays();
  }, []);

  // Загрузка новостей
  const loadNews = useCallback(async () => {
    try {
        const newsData = await api.get(`/api/news?current_user_id=${currentUser.id}`);
        const newsWithDefaults = newsData.map(item => ({
            ...item,
            author: item.author_name,
            description: item.content,
            comments: item.comments || [],
            likes_count: item.likes_count || 0,
            liked: item.liked || false,
            isPinned: item.is_pinned === true || item.is_pinned === 't',
            pin_order: item.pin_order !== null ? Number(item.pin_order) : null
        }));

        const sortedNews = newsWithDefaults.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            if (a.isPinned && b.isPinned) {
                return (a.pin_order || 0) - (b.pin_order || 0);
            }
            return new Date(b.publication_time) - new Date(a.publication_time);
        });

        setNews(sortedNews);
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}, [currentUser.id]);

  // Функция загрузки порталов
  const loadPortals = useCallback(async () => {
    try {
      const response = await api.get('/api/links');
      
      // Преобразуем ответ сервера в формат для отображения
      const formattedPortals = response.map(portal => ({
        id: portal.id,
        name: portal.name,
        description: portal.description,
        url: portal.url,
        icon: portal.icon_emoji,
        iconPreview: portal.icon_data ? `data:${portal.icon_type};base64,${portal.icon_data}` : null
      }));
      
      setPortals(formattedPortals);
    } catch (error) {
      console.error('Error loading portals:', error);
    }
  }, []);

  // Загружаем порталы при монтировании
  useEffect(() => {
    loadPortals();
  }, [loadPortals]);

  useEffect(() => {
    loadNews();

    wsClient.setMessageHandler((data) => {
        switch (data.type) {
            case "news_updated":
                loadNews();
                break;
                
            case "news_deleted":
                setNews(prevNews => prevNews.filter(news => news.id !== data.data.id));
                break;

            case "news_pin_updated":
                if (data.data && typeof data.data.news_id === 'number') {
                    setNews(prevNews => {
                        const updatedNews = prevNews.map(news => {
                            if (news.id === data.data.news_id) {
                                return {
                                    ...news,
                                    isPinned: data.data.is_pinned,
                                    pin_order: data.data.pin_order
                                };
                            }
                            return news;
                        });

                        return updatedNews.sort((a, b) => {
                            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                            if (a.isPinned && b.isPinned) {
                                return (a.pin_order || 0) - (b.pin_order || 0);
                            }
                            return new Date(b.publication_time) - new Date(a.publication_time);
                        });
                    });
                }
                break;
                
            case "comment_added":
                if (data.data && data.newsId) {
                    setNews(prevNews => prevNews.map(news => {
                        if (news.id === data.newsId) {
                            const commentExists = news.comments?.some(
                                comment => comment.id === data.data.id
                            );
                            
                            if (!commentExists) {
                                return {
                                    ...news,
                                    comments: [...(news.comments || []), data.data]
                                };
                            }
                        }
                        return news;
                    }));
                }
                break;

            case "likes_updated":
                if (data.data && data.data.news_id) {
                    setNews(prevNews => prevNews.map(news => {
                        if (news.id === data.data.news_id) {
                            return {
                                ...news,
                                likes_count: data.data.likes_count
                            };
                        }
                        return news;
                    }));
                }
                break;
            default:
                break;
        }
    });
}, [loadNews]);

  const handleLike = async (newsId) => {
    try {
        const response = await api.post(`/api/news/${Number.parseInt(newsId)}/like`, {
            employee_id: Number.parseInt(currentUser.id),
        });

        if (response.ok) {
            const data = await response.json();
            // Обновляем только состояние лайка текущего пользователя
            setNews((prevNews) =>
                prevNews.map((item) => {
                    if (item.id === newsId) {
                        return {
                            ...item,
                            liked: data.action === "liked"
                        };
                    }
                    return item;
                })
            );
        }
    } catch (error) {
        console.error("Error liking news:", error);
    }
};

  const handleAddComment = async (newsId, text) => {
    try {
        const response = await api.post(`/api/news/${newsId}/comments`, {
            employee_id: Number(currentUser.id),
            text: text,
        })

        // Убираем обновление состояния здесь, т.к. оно придет через WebSocket
        if (!response.ok) {
            const errorText = await response.text()
            console.error("Comment error response:", errorText)
        }
    } catch (error) {
        console.error("Error adding comment:", error)
    }
  }

  // Функция для редактирования новости
  const handleEditNews = async (newsItem) => {
    setEditingNews(newsItem);
    // Прокручиваем страницу к форме редактирования
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
  };

  // Функция для удаления новости
  const handleDeleteNews = async (newsId) => {
    if (showDeleteConfirm === newsId) {
        try {
            const response = await api.delete(`/api/news/${newsId}`);
            if (response.ok) {
                setShowDeleteConfirm(null);
                // Удаляем новость локально только если она еще существует в состоянии
                setNews(prevNews => prevNews.filter(news => news.id !== newsId));
            } else {
                console.error("Error deleting news");
            }
        } catch (error) {
            console.error("Error deleting news:", error);
        }
    } else {
        setShowDeleteConfirm(newsId);
    }
  }

  // Функция для закрепления/открепления новости
  const handlePinNews = async (newsId, isPinned) => {
    try {
        const response = await api.post(`/api/news/${newsId}/pin`, {
            isPinned: isPinned
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to pin news');
        }

        // Обновление будет происходить через WebSocket
        console.log('News pin status updated successfully');
    } catch (error) {
        console.error("Error pinning news:", error);
        alert('Failed to update news pin status: ' + error.message);
    }
  }

  // Функция для редактирования портала (помечаем как eslint-disable-next-line, так как она используется в JSX)
  // eslint-disable-next-line no-unused-vars
  const handleEditPortal = (portal) => {
    // Убедитесь, что icon_emoji передается корректно
    const portalToEdit = {
      ...portal,
      icon_emoji: portal.icon // Используем текущую иконку портала
    };
    setEditingPortal(portalToEdit);
    setIsNewPortal(false);
    setIsPortalModalOpen(true);
  }

  // Функция для добавления нового портала (помечаем как eslint-disable-next-line, так как она используется в JSX)
  // eslint-disable-next-line no-unused-vars
  const handleAddPortal = () => {
    setEditingPortal({
      id: Date.now(), // временный ID
      name: "",
      description: "",
      url: "",
      icon_emoji: "🔗", // Для нового портала
    })
    setIsNewPortal(true)
    setIsPortalModalOpen(true)
  }

  const handleSavePortal = async (updatedPortal, isNew, isDeleted = false) => {
    if (isDeleted) {
        // После успешного удаления обновляем список
        await loadPortals();
    } else {
        // После успешного создания/обновления обновляем список
        await loadPortals();
    }
    setEditingPortal(null);
    setIsPortalModalOpen(false);
    if (!isNewPortal) {
        setEditMode(false);
    }
  };

  const events = [
    {
      id: 1,
      title: "Тренинг по кибербезопасности",
      shortDescription: "Основы защиты корпоративных данных и личной информации",
      fullDescription:
        "Интерактивный тренинг, посвященный современным угрозам кибербезопасности и методам защиты от них. Участники узнают о фишинге, социальной инженерии и базовых принципах безопасной работы с данными.",
      date: "25 мая 2023",
      time: "14:00 - 16:30",
      location: "Конференц-зал А, 3 этаж",
      duration: "2.5 часа",
      totalSeats: 15,
      availableSeats: 5,
      speakers: [
        {
          id: 1,
          name: "Алексей Петров",
          position: "Руководитель отдела ИБ",
          photo: null,
        },
        {
          id: 2,
          name: "Елена Сидорова",
          position: "Специалист по защите данных",
          photo: null,
        },
      ],
    },
    {
      id: 2,
      title: "Семинар по проектному управлению",
      shortDescription: "Agile и Scrum методологии для эффективной работы команды",
      fullDescription:
        "Практический семинар по внедрению гибких методологий в рабочие процессы. Будут рассмотрены основные принципы Agile, роли в Scrum и практические инструменты для повышения эффективности командной работы.",
      date: "30 мая 2023",
      time: "10:00 - 13:00",
      location: "Конференц-зал Б, 2 этаж",
      duration: "3 часа",
      totalSeats: 20,
      availableSeats: 10,
      speakers: [
        {
          id: 3,
          name: "Михаил Иванов",
          position: "Scrum-мастер",
          photo: null,
        },
      ],
    },
  ]

  const handleAddNews = async (newNews) => {
    await loadNews()
  }

  // Функция форматирования телефонного номера
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return ""

    // Удаляем все нецифровые символы
    const numbers = phoneNumber.replace(/\D/g, "")

    if (numbers.length === 0) return ""
    if (numbers.length <= 1) return `+7`
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }

  // Функция форматирования даты
  const formatBirthdayDate = (person, showOriginalDate = false) => {
    if (!person.date) return "";
  
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
  
    // Для отображения оригинальной даты в деталях
    if (showOriginalDate) {
      const birthDate = new Date(person.date);
      return `${birthDate.getDate()} ${months[birthDate.getMonth()]} ${birthDate.getFullYear()}`;
    }
  
    // Проверяем количество дней до дня рождения
    if (person.days_until === 0) {
      return "сегодня";
    }
    if (person.days_until === 1) {
      return "сегодня";
    }
    if (person.days_until === 2) {
      return "завтра";
    }
  
    // Для остальных случаев показываем дату
    const birthDate = new Date(person.date);
    const nextDate = new Date();
    
    if (nextDate.getMonth() > birthDate.getMonth() || 
        (nextDate.getMonth() === birthDate.getMonth() && nextDate.getDate() > birthDate.getDate())) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    return `${birthDate.getDate()} ${months[birthDate.getMonth()]} ${nextDate.getFullYear()}`;
  };

  // Функция для копирования текста
  const copyToClipboardHandler = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label)
      setShowCopyNotification(true)
      setTimeout(() => {
        setShowCopyNotification(false)
      }, 2000)
    })
  }

  // Функция для переключения раскрытия информации о сотруднике
  const toggleBirthdayDetails = (personId) => {
    if (expandedBirthday === personId) {
      setExpandedBirthday(null)
    } else {
      setExpandedBirthday(personId)
    }
  }

  return (
    <main className={styles.main}>
      <style>
        {`
        .clickable-name {
          cursor: pointer;
          transition: color 0.3s ease;
        }
      `}
      </style>
      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.block}>
            <h2 className={styles.heading}>Новости и статьи</h2>
            {isAdmin && (
              <AddNewsForm
                onAddNews={handleAddNews}
                editingNews={editingNews}
                setEditingNews={setEditingNews}
                isAdmin={isAdmin}
                onUpdate={loadNews}
              />
            )}
            <div className={styles.newsList}>
              {news.map((item) => (
                <div key={item.id}>
                  {showDeleteConfirm === item.id && (
                    <div className={styles.deleteConfirmation}>
                      <p>Вы уверены, что хотите удалить эту новость?</p>
                      <div className={styles.deleteConfirmButtons}>
                        <button onClick={() => handleDeleteNews(item.id)} className={styles.confirmDeleteButton}>
                          Удалить
                        </button>
                        <button onClick={() => setShowDeleteConfirm(null)} className={styles.cancelDeleteButton}>
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                  <NewsItem
                    key={item.id}
                    news={item}
                    onLike={handleLike}
                    onAddComment={handleAddComment}
                    onEdit={handleEditNews}
                    onDelete={handleDeleteNews}
                    onPin={handlePinNews}
                    isAdmin={isAdmin}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.rightColumnFixed}>
            <div className={styles.block}>
              <div className={styles.portalHeader}>
                <h2 className={styles.heading}>Внутренние порталы</h2>
                {isAdmin && (
                  <div className={styles.portalAdminControls}>
                    <button
                      onClick={() => setShowPortalMenu(!showPortalMenu)}
                      className={styles.editPortalsButton}
                      title="Управление порталами"
                    >
                      <FontAwesomeIcon icon={faEdit} className={styles.editPortalsIcon} />
                    </button>
                    {showPortalMenu && (
                      <div className={styles.portalMenu}>
                        <button
                          className={styles.portalMenuItem}
                          onClick={() => {
                            setEditMode(true)
                            setShowPortalMenu(false)
                          }}
                        >
                          Редактировать существующий портал
                        </button>
                        <button
                          className={styles.portalMenuItem}
                          onClick={() => {
                            setEditingPortal({
                              id: Date.now(), // временный ID
                              name: "",
                              description: "",
                              url: "",
                              icon_emoji: "🔗", // Для нового портала
                            })
                            setIsNewPortal(true)
                            setIsPortalModalOpen(true)
                            setShowPortalMenu(false)
                          }}
                        >
                          Создать новый портал
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {editMode && (
                <div className={styles.editModeNotification}>
                  <span>Режим редактирования. Нажмите на портал для изменения.</span>
                  <button className={styles.exitEditModeButton} onClick={() => setEditMode(false)}>
                    Выйти из режима редактирования
                  </button>
                </div>
              )}
              <div className={styles.portalGrid}>
                {portals.map((portal) => (
                  <div
                    key={portal.id}
                    className={`${styles.portalContainer} ${editMode ? styles.portalContainerEditable : ""}`}
                    onClick={() => {
                      if (editMode) {
                        const portalToEdit = {
                          ...portal,
                          icon_emoji: portal.icon,
                          icon_data: portal.iconPreview ? portal.iconPreview.split(',')[1] : null,
                          icon_type: portal.iconPreview ? portal.iconPreview.split(',')[0].split(':')[1].split(';')[0] : null
                        };
                        setEditingPortal(portalToEdit);
                        setIsNewPortal(false);
                        setIsPortalModalOpen(true);
                      }
                    }}
                  >
                    <a
                      href={portal.url}
                      className={styles.portalLink}
                      onClick={(e) => {
                        if (editMode) {
                          e.preventDefault()
                        } else {
                          e.currentTarget.querySelector(".portalName").style.color = "#EE6B0C"
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!editMode) {
                          e.currentTarget.querySelector(".portalName").style.color = "#EE6B0C"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!editMode) {
                          e.currentTarget.querySelector(".portalName").style.color = "#000000"
                        }
                      }}
                    >
                      <div className={styles.portalContent}>
                        <div className={styles.portalIcon}>
                          {portal.iconPreview ? (
                            <img
                              src={portal.iconPreview || "/placeholder.svg"}
                              alt={portal.name}
                              className={styles.portalIconImg}
                            />
                          ) : (
                            <span className={styles.portalIconText}>{portal.icon}</span>
                          )}
                        </div>
                        <div className={styles.portalInfo}>
                          <span className={`portalName ${styles.portalName}`}>{portal.name}</span>
                          <p className={styles.portalDescription}>{portal.description}</p>
                        </div>
                      </div>
                    </a>
                    {editMode && (
                      <div className={styles.editModeIndicator}>
                        <FontAwesomeIcon icon={faEdit} className={styles.editModeIcon} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.block}>
              <h2 className={styles.heading}>Мероприятия</h2>
              <div className={styles.eventsList}>
                {events.map((event) => (
                  <div key={event.id}>
                    <Event key={event.id} event={event} />
                    {/* Добавляем серую разделительную полоску между мероприятиями */}
                    {event.id !== events[events.length - 1].id && <div className={styles.eventDivider}></div>}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.block}>
              <h2 className={styles.heading}>Ближайшие дни рождения</h2>
              <div className={styles.birthdayList}>
                {isBirthdaysLoading ? (
                  <div className={styles.loadingState}>Загрузка...</div>
                ) : birthdays.length > 0 ? (
                  birthdays.map((person) => (
                    <div key={person.id}>
                      <div className={styles.birthdayItem} onClick={() => toggleBirthdayDetails(person.id)}>
                        <div className={styles.birthdayAvatar}>
                          <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
                        </div>
                        <div className={styles.birthdayInfo}>
                        <p className={styles.birthdayName}>
                          {person.name} - {formatBirthdayDate(person)}
                        </p>
                        </div>
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className={styles.expandIcon}
                          style={{
                            transform: expandedBirthday === person.id ? "rotate(90deg)" : "none",
                            transition: "transform 0.3s ease",
                          }}
                        />
                      </div>

                      {expandedBirthday === person.id && (
                        <div className={styles.birthdayDetails}>
                          <div className={styles.birthdayDetailsSection}>
                            <h4 className={styles.birthdayDetailsTitle}>Основная информация</h4>
                            <div className={styles.birthdayDetailsRow}>
                              <span className={styles.birthdayDetailsLabel}>Табельный номер:</span>
                              <span className={styles.birthdayDetailsValue}>
                                {person.personnel_number || "Не указан"}
                              </span>
                            </div>
                            <div className={styles.birthdayDetailsRow}>
                              <span className={styles.birthdayDetailsLabel}>Дата рождения:</span>
                              <span className={styles.birthdayDetailsValue}>
                                {formatBirthdayDate(person, true)}
                              </span>
                            </div>
                            <div className={styles.birthdayDetailsRow}>
                              <span className={styles.birthdayDetailsLabel}>Местоположение:</span>
                              <span className={styles.birthdayDetailsValue}>
                                {person.location || "Не указано"}
                              </span>
                            </div>
                            <div className={styles.birthdayDetailsRow}>
                              <span className={styles.birthdayDetailsLabel}>Организация:</span>
                              <span className={styles.birthdayDetailsValue}>
                                {person.organization || "Не указана"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.birthdayDetailsSection}>
                            <h4 className={styles.birthdayDetailsTitle}>Контактная информация</h4>
                            <div className={styles.birthdayDetailsRow}>
                              <span className={styles.birthdayDetailsLabel}>Рабочий телефон:</span>
                              <div className={styles.birthdayDetailsValueWithCopy}>
                                <span className={styles.birthdayDetailsValue}>
                                  {formatPhoneNumber(person.work_phone) || "Не указан"}
                                </span>
                                {person.work_phone && (
                                  <button
                                    className={styles.copyButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboardHandler(person.work_phone, "Рабочий телефон");
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faCopy} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>Нет ближайших дней рождения</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Уведомление о копировании */}
      {showCopyNotification && <div className={styles.copyNotification}>{copiedText} скопирован в буфер обмена</div>}

      {/* Модальное окно редактирования портала */}
      <PortalEditModal
        isOpen={isPortalModalOpen}
        onClose={() => {
          setIsPortalModalOpen(false)
          if (!isNewPortal) {
            setEditMode(false)
          }
        }}
        portal={editingPortal}
        onSave={handleSavePortal}
        isNewPortal={isNewPortal}
        loadPortals={loadPortals}
        onExitEditMode={() => setEditMode(false)}
      />
    </main>
  )
}

export default MainContent

