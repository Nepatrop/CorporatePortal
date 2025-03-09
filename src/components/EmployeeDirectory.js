"use client"

import { useState } from "react"
import Header from "./Header"

function EmployeeDirectory() {
  // Данные сотрудников (отсортированы по алфавиту)
  const [employees] = useState([
    {
      id: 1,
      name: "Андреев Андрей Андреевич",
      department: "IT-отдел",
      position: "Старший разработчик",
      phone: "+7 (123) 456-78-90",
      email: "andreev@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=11",
    },
    {
      id: 2,
      name: "Борисова Екатерина Сергеевна",
      department: "Бухгалтерия",
      position: "Главный бухгалтер",
      phone: "+7 (123) 456-78-91",
      email: "borisova@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=5",
    },
    {
      id: 3,
      name: "Васильев Дмитрий Иванович",
      department: "Отдел продаж",
      position: "Менеджер по продажам",
      phone: "+7 (123) 456-78-92",
      email: "vasiliev@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=12",
    },
    {
      id: 4,
      name: "Григорьева Анна Павловна",
      department: "HR-отдел",
      position: "HR-менеджер",
      phone: "+7 (123) 456-78-93",
      email: "grigorieva@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=9",
    },
    {
      id: 5,
      name: "Дмитриев Сергей Александрович",
      department: "IT-отдел",
      position: "Системный администратор",
      phone: "+7 (123) 456-78-94",
      email: "dmitriev@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=13",
    },
    {
      id: 6,
      name: "Ефимова Мария Владимировна",
      department: "Маркетинг",
      position: "Маркетолог",
      phone: "+7 (123) 456-78-95",
      email: "efimova@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=6",
    },
    {
      id: 7,
      name: "Жуков Алексей Петрович",
      department: "Отдел разработки",
      position: "Frontend-разработчик",
      phone: "+7 (123) 456-78-96",
      email: "zhukov@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=14",
    },
    {
      id: 8,
      name: "Зайцева Ольга Николаевна",
      department: "Бухгалтерия",
      position: "Бухгалтер",
      phone: "+7 (123) 456-78-97",
      email: "zaitseva@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=7",
    },
    {
      id: 9,
      name: "Иванов Иван Иванович",
      department: "Руководство",
      position: "Генеральный директор",
      phone: "+7 (123) 456-78-98",
      email: "ivanov@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=15",
    },
    {
      id: 10,
      name: "Козлова Наталья Игоревна",
      department: "Отдел продаж",
      position: "Руководитель отдела продаж",
      phone: "+7 (123) 456-78-99",
      email: "kozlova@it-element29.ru",
      photo: "https://i.pravatar.cc/300?img=8",
    },
  ])

  // Функция для группировки сотрудников по первой букве фамилии
  const groupEmployeesByFirstLetter = () => {
    const grouped = {}

    employees.forEach((employee) => {
      const firstLetter = employee.name.charAt(0).toUpperCase()
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = []
      }
      grouped[firstLetter].push(employee)
    })

    return grouped
  }

  const groupedEmployees = groupEmployeesByFirstLetter()
  const alphabet = Object.keys(groupedEmployees).sort()

  return (
    <div style={styles.container}>
      <Header onNavigate={(page) => (window.location.href = page === "home" ? "/" : "/directory")} />
      <main style={styles.main}>
        <h1 style={styles.heading}>Справочник сотрудников</h1>

        <div style={styles.alphabetNav}>
          {alphabet.map((letter) => (
            <a key={letter} href={`#section-${letter}`} style={styles.alphabetLink}>
              {letter}
            </a>
          ))}
        </div>

        <div style={styles.employeeList}>
          {alphabet.map((letter) => (
            <div key={letter} id={`section-${letter}`} style={styles.letterSection}>
              <h2 style={styles.letterHeading}>{letter}</h2>
              {groupedEmployees[letter].map((employee) => (
                <div key={employee.id} style={styles.employeeCard}>
                  <div style={styles.employeePhoto}>
                    <img src={employee.photo || "/placeholder.svg"} alt={employee.name} style={styles.photo} />
                  </div>
                  <div style={styles.employeeInfo}>
                    <h3 style={styles.employeeName}>{employee.name}</h3>
                    <p style={styles.employeeDepartment}>{employee.department}</p>
                    <p style={styles.employeePosition}>{employee.position}</p>
                    <div style={styles.employeeContacts}>
                      <p style={styles.employeePhone}>{employee.phone}</p>
                      <p style={styles.employeeEmail}>{employee.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: "'Manrope', Arial, sans-serif",
    backgroundColor: "#EBEBEB",
    minHeight: "100vh",
  },
  main: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    color: "#13454B",
    borderBottom: "2px solid #EE6B0C",
    fontFamily: "'Manrope', Arial, sans-serif",
    fontWeight: 600,
    fontSize: "36px",
    lineHeight: "45px",
    letterSpacing: "0.5px",
    padding: "15px 0 12px 0",
    marginBottom: "40px",
  },
  alphabetNav: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "2rem",
    padding: "1rem",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  alphabetLink: {
    display: "inline-block",
    width: "30px",
    height: "30px",
    lineHeight: "30px",
    textAlign: "center",
    backgroundColor: "#13454B",
    color: "#FFFFFF",
    borderRadius: "50%",
    textDecoration: "none",
    fontWeight: 500,
    transition: "background-color 0.3s",
  },
  employeeList: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  letterSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  letterHeading: {
    color: "#13454B",
    borderBottom: "1px solid #EE6B0C",
    paddingBottom: "0.5rem",
    marginBottom: "1.5rem",
    fontSize: "24px",
  },
  employeeCard: {
    display: "flex",
    alignItems: "center",
    padding: "1rem",
    borderBottom: "1px solid #e0e0e0",
    gap: "1.5rem",
  },
  employeePhoto: {
    flexShrink: 0,
  },
  photo: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #13454B",
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    color: "#13454B",
    fontSize: "18px",
    fontWeight: 500,
    marginBottom: "0.25rem",
  },
  employeeDepartment: {
    color: "#EE6B0C",
    fontWeight: 500,
    marginBottom: "0.25rem",
  },
  employeePosition: {
    color: "#333333",
    marginBottom: "0.5rem",
    fontWeight: 300,
  },
  employeeContacts: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
  },
  employeePhone: {
    color: "#666666",
    fontSize: "0.9rem",
  },
  employeeEmail: {
    color: "#666666",
    fontSize: "0.9rem",
  },
}

export default EmployeeDirectory

