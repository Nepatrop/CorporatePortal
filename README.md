# backend
## Скрипт init_database.sh

Скрипт выполняется для инициализации БД на машине, также поддерживает возможность заполнения таблиц БД тестовыми данными (опционально).

## Сборка основного бинарника

Для основной сборки, в первый раз можно использовать скрипт build.bat в директории backend. Необходимо просто запустить его. Предварительно установив зависиммости.

### Подготовка к сборке

Зависимости: PostgreSQL, libpqxx, nlohmann_json.

Исправить: В данный момент сборка заточена под использование vcpkg, на Windows, также захардкожена его директория, а именно **C:/dev/vcpkg**.

(Установка vcpkg)[https://learn.microsoft.com/ru-ru/vcpkg/get_started/get-started?pivots=shell-powershell]

Установить необходимо в предварительно созданную директорию: **C:/dev**

Следовательно и для установки зависиммостей на Windows необходимо использовать vcpkg, командами:
```bash
vcpkg install nlohmann-json:x64-windows
vcpkg install libpqxx:x64-windows
```

PostgreSQL устанавливается отдельно с оффициального сайта.

Для Unix подобных систем также предварительно необходимо скачать сам компилятор:
```bash
sudo apt-get install build-essential
```

Автоматической сборки под Linux ещё нету.

### Сборка

#### Автоматическая

Запустить build.bat в директории backend.

Создасться директория build, с файлами компиляции, далее в директории Release будет находится итоговый .exe со всей логикой работы.

#### Ручная

Создать папку build в директории backend:
```bash
mkdir build
```

Перейти в неё:
```bash
cd build
```

Запустить сборку CMake (на данный момент с указанием пути до vcpkg, на Linux команда выглядит по другому, vcpkg можно поставить пакетом):
```bash
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake
```

Собрать Release версию:
```bash
cmake --build . --config Release
```

Перейти в Release:
```bash
cd Release
```

Запустить .exe:
```bash
corporate_portal_backend.exe
```

## Взаимодействие с сервером

После сборки и запуска, по адресу **http://localhost:8080** будет достен API.

Список api эндпоинтов get запросов (возвращают json всех записей из указанной таблицы):
- /api/news
- /api/organizations
- /api/departments
- /api/locations
- /api/employees
- /api/notifications
- /api/links

Поддерживаются POST запросы для записи данных в БД, пример POST запроса через консоль браузера:
```javascript
fetch('http://192.168.131.29:8080/api/organizations', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: "ООО Рога и Копыта"
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

При успешной записи возвращается response от сервера:
```json
{
    "success": true
}
```

--------------------------------------------------------------------------

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
