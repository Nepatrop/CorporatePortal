import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import Header from './Header';

const EmployeeDirectory = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Загрузка данных о сотрудниках
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:8081/api/employees', {
                    headers: {
                        'X-API-Key': 'cp_e29b7d8f4a6c2135d9f0'
                    }
                });

                console.log("Данные о сотрудниках:", response.data); // Логируем данные
                setEmployees(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Ошибка при загрузке данных:", err); // Логируем ошибку
                setError('Ошибка при загрузке данных');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Фильтрация сотрудников по поисковому запросу
    const filteredEmployees = employees.filter((employee) =>
        employee.employee && employee.employee.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Отображение загрузки или ошибки
    if (loading) return <div style={styles.loading}>Загрузка...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <>
            <Header onNavigate={(page) => (window.location.href = page === "home" ? "/" : "/directory")} />
            <div style={styles.container}>
                <div style={styles.main}>
                    <h2 style={styles.heading}>Справочник сотрудников</h2>

                    {/* Поле для поиска сотрудников */}
                    <div style={styles.alphabetNav}>
                        <input
                            type="text"
                            placeholder="Поиск сотрудника..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '4px' }}
                        />
                    </div>

                    {/* Список сотрудников */}
                    <div style={styles.employeeList}>
                        {filteredEmployees.map((employee) => (
                            <div key={employee.id} style={styles.employeeCard}>
                                <div style={styles.employeePhoto}>
                                    {employee.photo ? (
                                        <img
                                            src={employee.photo}
                                            alt={employee.employee}
                                            style={styles.photo}
                                        />
                                    ) : (
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            style={{ fontSize: "40px", color: styles.employeeName.color }}
                                        />
                                    )}
                                </div>
                                <div style={styles.employeeInfo}>
                                    <h4 style={styles.employeeName}>{employee.employee}</h4>
                                    <p style={styles.employeeDepartment}>
                                        <strong>Отдел:</strong> {employee.department}
                                    </p>
                                    <p style={styles.employeePosition}>
                                        <strong>Должность:</strong> {employee.position}
                                    </p>
                                    <p style={styles.employeePhone}>
                                        <strong>Телефон:</strong> {employee.work_phone}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

// Стили
const styles = {
    container: {
        fontFamily: "'Manrope', Arial, sans-serif",
        backgroundColor: "#EBEBEB",
        minHeight: "100vh",
        paddingTop: "20px",
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
    employeeList: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    employeeCard: {
        display: "flex",
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    employeePhoto: {
        flexShrink: 0,
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        overflow: "hidden",
        marginRight: "1rem",
        backgroundColor: "#ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    photo: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    employeeInfo: {
        flex: 1,
    },
    employeeName: {
        color: "#13454B",
        fontSize: "18px",
        fontWeight: 600,
        marginBottom: "0.5rem",
    },
    employeeDepartment: {
        color: "#EE6B0C",
        fontWeight: 500,
        marginBottom: "0.5rem",
    },
    employeePosition: {
        color: "#333333",
        marginBottom: "0.5rem",
        fontWeight: 300,
    },
    employeePhone: {
        color: "#333333",
        marginBottom: "0.5rem",
        fontWeight: 300,
    },
    loading: {
        textAlign: "center",
        fontSize: "18px",
        marginTop: "20px",
    },
    error: {
        textAlign: "center",
        fontSize: "18px",
        marginTop: "20px",
        color: "red",
    },
};

export default EmployeeDirectory;