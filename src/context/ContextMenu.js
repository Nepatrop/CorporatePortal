"use client"

import { useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faDownload } from "@fortawesome/free-solid-svg-icons"
import styles from "../styles/EmployeeDirectory.module.css"

const ContextMenu = ({ visible, x, y, onDelete, onDownload, onClose }) => {
  // Обработчик клика вне контекстного меню
  useEffect(() => {
    const handleClickOutside = () => {
      if (visible) {
        onClose()
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      className={styles.contextMenu}
      style={{
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={styles.contextMenuItem}
        onClick={() => {
          onDelete()
          onClose()
        }}
      >
        <FontAwesomeIcon icon={faTrash} className={styles.contextMenuIcon} />
        <span>Удалить сотрудников</span>
      </div>
      <div
        className={styles.contextMenuItem}
        onClick={() => {
          onDownload()
          onClose()
        }}
      >
        <FontAwesomeIcon icon={faDownload} className={styles.contextMenuIcon} />
        <span>Скачать список</span>
      </div>
    </div>
  )
}

export default ContextMenu

