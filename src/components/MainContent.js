function MainContent() {
    const internalPortals = [
      { id: 1, name: "HR Портал", url: "#", icon: "👥" },
      { id: 2, name: "База знаний", url: "#", icon: "🎓" },
      { id: 3, name: "IT Поддержка", url: "#", icon: "💻" },
      { id: 4, name: "Документация", url: "#", icon: "📄" },
      { id: 5, name: "Обучение", url: "#", icon: "🎓" },
    ];
  
    const news = [
      { id: 1, title: "Новый проект запущен", date: "2023-05-15" },
      { id: 2, title: "Обновление системы безопасности", date: "2023-05-14" },
    ];
  
    const birthdays = [
      { id: 1, name: "Иван Иванов", date: "дата дня рождения" },
      { id: 2, name: "Мария Петрова", date: "дата дня рождения" },
    ];
  
    return (
      <main style={styles.main}>
        <div style={styles.leftColumn}>
          <h2 style={styles.heading}>Внутренние порталы</h2>
          <div style={styles.portalGrid}>
            {internalPortals.map((portal) => (
              <a key={portal.id} href={portal.url} style={styles.portalLink}>
                <div style={styles.portalIcon}>{portal.icon}</div>
                <span style={styles.portalName}>{portal.name}</span>
              </a>
            ))}
          </div>
        </div>
        <div style={styles.rightColumn}>
          <div style={styles.block}>
            <h2 style={styles.heading}>Новости и статьи</h2>
            <ul style={styles.list}>
              {news.map((item) => (
                <li key={item.id} style={styles.listItem}>
                  <h3 style={styles.subheading}>{item.title}</h3>
                  <p style={styles.date}>{item.date}</p>
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.block}>
            <h2 style={styles.heading}>Ближайшие дни рождения</h2>
            <ul style={styles.list}>
              {birthdays.map((person) => (
                <li key={person.id} style={styles.listItem}>
                  <p>
                    {person.name} - <span style={styles.date}>{person.date}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    );
  }
  
  const styles = {
    main: {
      display: "flex",
      height: "calc(100vh - 72px)", // Вычитаем высоту хедера
      fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
      overflowX: "hidden", // Запрещаем горизонтальную прокрутку
      padding: "1rem", // Внешний отступ для всего контейнера
    },
    leftColumn: {
      flex: "0 0 60%", // Левая часть занимает 60% ширины
      padding: "2rem",
      backgroundColor: "#FFFFFF", // Белый фон
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)", // Тень
      borderRadius: "8px", // Скругление углов
      marginRight: "1rem", // Отступ между левой и правой колонками
      overflowY: "auto", // Прокрутка, если контент не помещается
      boxSizing: "border-box", // Учитываем padding и border в ширине
    },
    rightColumn: {
      flex: "0 0 40%", // Правая часть занимает 40% ширины
      display: "flex",
      flexDirection: "column",
      gap: "1rem", // Отступ между блоками "Новости" и "Дни рождения"
      overflowY: "auto", // Прокрутка, если контент не помещается
      boxSizing: "border-box", // Учитываем padding и border в ширине
      paddingRight: "1rem", // Добавляем отступ справа
    },
    block: {
      backgroundColor: "#FFFFFF", // Белый фон для блоков
      padding: "1.5rem",
      borderRadius: "8px", // Скругление углов
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Тень
      flex: 1, // Растягиваем блоки по высоте
    },
    heading: {
      color: "#13454B", // ИЗУМРУДНЫЙ
      borderBottom: "2px solid #EE6B0C", // ОРАНЖЕВЫЙ
      paddingBottom: "0.5rem",
      marginBottom: "1.5rem",
      fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
      fontWeight: 500, // Medium для заголовков
      fontSize: "1.5rem",
    },
    portalGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", // Адаптивная сетка
      gap: "1.5rem", // Отступы между элементами
    },
    portalLink: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textDecoration: "none",
      color: "#13454B",
      transition: "transform 0.2s",
      "&:hover": {
        transform: "scale(1.05)", // Эффект при наведении
      },
    },
    portalIcon: {
      fontSize: "2rem",
      marginBottom: "0.5rem",
    },
    portalName: {
      textAlign: "center",
      fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
      fontWeight: 300, // Light для основного текста
    },
    subheading: {
      color: "#13454B", // ИЗУМРУДНЫЙ
      margin: "0 0 0.5rem 0",
      fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
      fontWeight: 500, // Medium для подзаголовков
    },
    list: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    listItem: {
      marginBottom: "1rem",
      fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
      fontWeight: 300, // Light для основного текста
    },
    date: {
      color: "#B3B3B3", // БЕТОННЫЙ СЕРЫЙ
      fontSize: "0.9em",
      fontFamily: "'Arial', sans-serif", // Дополнительный шрифт
      fontWeight: 400, // Regular для дат
    },
  };
  
  export default MainContent;