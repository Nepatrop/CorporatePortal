import Header from "./components/Header";
import MainContent from "./components/MainContent";

function App() {
  return (
    <div className="App" style={styles.app}>
      <Header />
      <MainContent />
    </div>
  );
}

const styles = {
  app: {
    fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
    backgroundColor: "#EBEBEB", // СЕРЫЙ
    minHeight: "100vh",
  },
};

export default App;