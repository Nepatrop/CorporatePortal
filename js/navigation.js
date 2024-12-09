async function loadContent(page) {
    const mainContent = document.querySelector('.main-content');
    
    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        
        mainContent.innerHTML = data;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    } catch (error) {
        console.error('Error loading content:', error);
        mainContent.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Ошибка загрузки содержимого</h4>
                    <p>Не удалось загрузить страницу "${page}". Пожалуйста, попробуйте позже или обратитесь к администратору.</p>
                    <hr>
                    <p class="mb-0">
                        <button class="btn btn-outline-danger btn-sm" onclick="loadContent('main')">
                            <i class="fas fa-home"></i> Вернуться на главную
                        </button>
                    </p>
                </div>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.getAttribute('data-page');
            if (page) {
                loadContent(page);
                
                const navbarToggler = document.querySelector('.navbar-toggler');
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarToggler && navbarCollapse && window.getComputedStyle(navbarToggler).display !== 'none') {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-page]')) {
            e.preventDefault();
            const page = e.target.closest('[data-page]').getAttribute('data-page');
            if (page) {
                loadContent(page);
            }
        }
    });

    loadContent('main');
});