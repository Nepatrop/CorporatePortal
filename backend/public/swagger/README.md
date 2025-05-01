# API Documentation

## Просмотр документации

1. Откройте файл index.html в браузере для просмотра документации в интерактивном режиме

2. Или используйте Docker для запуска Swagger UI:
```bash
docker run -p 8080:8080 -v $(pwd):/usr/share/nginx/html/swagger nginx
```

3. После этого документация будет доступна по адресу: http://localhost:8080/swagger