from fastapi import FastAPI, Header
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
import time
from datetime import datetime
import uvicorn
import json
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Database configuration
DB_CONFIG = {
    "dbname": "corporate_portal",
    "user": "postgres",
    "password": "diploma",
    "host": "localhost",
    "port": "5432"
}

# Create app factory function
def create_app():
    app = FastAPI()
    
    # Configure DB pool
    global pool
    pool = ThreadedConnectionPool(
        minconn=5,
        maxconn=20,
        **DB_CONFIG
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register routes
    @app.get("/api/employees")
    async def get_employees():
        return await get_cached_data('employees', 
            lambda: execute_query(PREPARED_QUERIES['get_employees'])
        )
    
    @app.get("/api/news")
    async def get_news():
        return await get_cached_data('news', 
            lambda: execute_query(PREPARED_QUERIES['get_news'])
        )

    @app.get("/api/links")
    async def get_links():
        return await get_cached_data('links', 
            lambda: execute_query(PREPARED_QUERIES['get_links'])
        )

    @app.get("/api/departments")
    async def get_departments():
        return await get_cached_data('departments', 
            lambda: execute_query(PREPARED_QUERIES['get_departments'])
        )

    @app.get("/api/birthdays/upcoming")
    async def get_upcoming_birthdays():
        return await get_cached_data('upcoming_birthdays', 
            lambda: execute_query(PREPARED_QUERIES['get_upcoming_birthdays'])
        )
    
    return app

# Create app instance for uvicorn
app = create_app()

# Создаем пул потоков для асинхронных операций
thread_pool = ThreadPoolExecutor(max_workers=10)

# Кэширование для часто запрашиваемых данных
cache = {}
cache_timeout = 60  # секунд

async def get_cached_data(key, query_func):
    now = time.time()
    if key in cache and now - cache[key]['time'] < cache_timeout:
        return cache[key]['data']
    
    data = await query_func()
    cache[key] = {
        'data': data,
        'time': now
    }
    return data

# Оптимизированные подготовленные запросы
PREPARED_QUERIES = {
    'get_employees': """
        SELECT 
            e.id, e.full_name, e.position, 
            e.personnel_number, e.work_phone,
            o.name as organization,
            d.name as department,
            l.name as location
        FROM employees e
        LEFT JOIN LATERAL (
            SELECT name FROM organizations WHERE id = e.organization_id
        ) o ON true
        LEFT JOIN LATERAL (
            SELECT name FROM departments WHERE id = e.department_id
        ) d ON true
        LEFT JOIN LATERAL (
            SELECT name FROM locations WHERE id = e.location_id
        ) l ON true
    """,
    'get_news': """
        SELECT 
            n.*, e.full_name as author_name,
            COALESCE(
                (SELECT json_agg(
                    json_build_object(
                        'id', c.id,
                        'text', c.text,
                        'author', ce.full_name,
                        'created_at', c.created_at
                    )
                )
                FROM news_comments c
                LEFT JOIN employees ce ON c.employee_id = ce.id
                WHERE c.news_id = n.id), '[]'
            ) as comments
        FROM news n
        LEFT JOIN employees e ON n.author_id = e.id
        ORDER BY n.is_pinned DESC, n.publication_time DESC
    """,
    'get_links': """
        SELECT 
            id, name, description, url,
            CASE 
                WHEN icon_data IS NOT NULL THEN encode(icon_data, 'base64')
                ELSE NULL 
            END as icon_data,
            icon_type, icon_emoji
        FROM links 
        ORDER BY created_at DESC
    """,
    'get_departments': """
        SELECT d.*, o.name as organization_name 
        FROM departments d 
        LEFT JOIN LATERAL (
            SELECT name FROM organizations WHERE id = d.organization_id
        ) o ON true
    """,
    'get_upcoming_birthdays': """
        WITH upcoming_birthdays AS (
            SELECT 
                e.id,
                e.full_name as name,
                e.birth_date as date,
                e.position,
                e.personnel_number,
                e.work_phone,
                o.name as organization,
                d.name as department,
                l.name as location,
                CASE
                    WHEN (DATE_PART('month', CURRENT_DATE) > DATE_PART('month', e.birth_date))
                        OR (DATE_PART('month', CURRENT_DATE) = DATE_PART('month', e.birth_date) 
                            AND DATE_PART('day', CURRENT_DATE) > DATE_PART('day', e.birth_date))
                    THEN 
                        (DATE(DATE_PART('year', CURRENT_DATE) + 1 || '-' || 
                              DATE_PART('month', e.birth_date) || '-' || 
                              DATE_PART('day', e.birth_date)) - CURRENT_DATE)
                    ELSE 
                        (DATE(DATE_PART('year', CURRENT_DATE) || '-' || 
                              DATE_PART('month', e.birth_date) || '-' || 
                              DATE_PART('day', e.birth_date)) - CURRENT_DATE)
                END as days_until
            FROM employees e
            LEFT JOIN LATERAL (
                SELECT name FROM organizations WHERE id = e.organization_id
            ) o ON true
            LEFT JOIN LATERAL (
                SELECT name FROM departments WHERE id = e.department_id
            ) d ON true
            LEFT JOIN LATERAL (
                SELECT name FROM locations WHERE id = e.location_id
            ) l ON true
            WHERE e.birth_date IS NOT NULL 
            AND e.is_dismissed = false
        )
        SELECT *
        FROM upcoming_birthdays
        WHERE days_until >= 0
        ORDER BY days_until ASC
        LIMIT 5
    """
}

# Асинхронное выполнение запросов в БД
async def execute_query(query, params=None):
    def run_query():
        conn = pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, params)
                return cur.fetchall()
        finally:
            pool.putconn(conn)

    return await asyncio.get_event_loop().run_in_executor(
        thread_pool, run_query
    )

if __name__ == "__main__":
    uvicorn.run(
        "server:app",  # Use import string format
        host="0.0.0.0",
        port=8083,
        workers=4,
        reload=True,
        loop="uvloop"
    )
