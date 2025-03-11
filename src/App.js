"use client"

import { useState } from "react"
import Header from "./components/Header"
import MainContent from "./components/MainContent"
import EmployeeDirectory from "./components/EmployeeDirectory"

function App() {
    const [currentPage, setCurrentPage] = useState("home")

    const handleNavigate = (page) => {
        setCurrentPage(page)
    }

    return (
        <div className="App" style={styles.app}>
            {currentPage === "home" ? (
                <>
                    <Header onNavigate={handleNavigate} />
                    <MainContent />
                </>
            ) : currentPage === "directory" ? (
                <EmployeeDirectory onNavigate={handleNavigate} />
            ) : null}
        </div>
    )
}

const styles = {
    app: {
        fontFamily: "'Manrope', Arial, sans-serif",
        backgroundColor: "#EBEBEB",
        minHeight: "100vh",
    },
}

export default App