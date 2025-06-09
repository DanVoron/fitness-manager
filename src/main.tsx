import React, { StrictMode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client'
import './index.css'
import TrainingApp from './TrainingApp.tsx'
import Header from "./components/Header.tsx"
import UsersManagement from "@/components/UserManagement.tsx";
import TrainingManagement from "@/components/TrainingManagement.tsx";
import LoginPage from "@/components/LoginPage.tsx";
import Error from "@/components/Error.tsx";
import UserProgressDashboard from "@/components/UserProgressDashboard.tsx";
import MyTrainings from "@/components/MyTrainings.tsx";
import MyProgress from "@/components/MyProgress.tsx";
import {jwtDecode} from 'jwt-decode';

// Интерфейс для декодированного токена
interface DecodedToken {
    role: string;
    [key: string]: any;
}

// Компонент для защиты маршрутов
const ProtectedRoute = ({
                            children,
                            allowedRoles
                        }: {
    children: React.ReactNode;
    allowedRoles?: string[]
}) => {
    const token = localStorage.getItem('authToken');

    // Если токена нет - редирект на логин
    if (!token) {
        return <Navigate to="/" replace />;
    }

    try {
        // Декодируем токен
        const decoded: DecodedToken = jwtDecode(token);
        const userRole = decoded.role;

        // Админ имеет доступ ко всем страницам
        if (userRole === 'Админ') {
            return <>{children}</>;
        }

        if (allowedRoles) {
            // Проверяем роль пользователя
            if (!allowedRoles.includes(userRole)) {
                return <Error message="Доступ запрещен: недостаточно прав" />;
            }
        }

        return <>{children}</>;
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        localStorage.removeItem('authToken');
        return <Navigate to="/" replace />;
    }
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <LoginPage />,
        errorElement: <Error />
    },
    {
        path: '/UsersManagement',
        element: (
            <ProtectedRoute allowedRoles={['Админ']}>
                <Header />
                <UsersManagement />
            </ProtectedRoute>
        ),
        errorElement: <Error/>
    },
    {
        path: '/UserProgressDashboard',
        element: (
            <ProtectedRoute allowedRoles={['Админ', 'Тренер']}>
                <Header/>
                <UserProgressDashboard />
            </ProtectedRoute>
        ),
        errorElement: <Error/>
    },
    {
        path: '/MyTrainings',
        element: (
            <ProtectedRoute allowedRoles={['Админ', 'Тренер', 'Пользователь']}>
                <Header/>
                <MyTrainings />
            </ProtectedRoute>
        ),
        errorElement: <Error/>
    },
    {
        path: '/MyProgress',
        element: (
            <ProtectedRoute allowedRoles={['Админ', 'Тренер', 'Пользователь']}>
                <Header/>
                <MyProgress />
            </ProtectedRoute>
        ),
        errorElement: <Error/>
    },
    {
        path: '/TrainingManagement',
        element: (
            <ProtectedRoute allowedRoles={['Админ', 'Тренер']}>
                <Header/>
                <TrainingManagement />
            </ProtectedRoute>
        ),
        errorElement: <Error/>
    },
    {
        path: '*',
        element: <Error message="Страница не найдена" />
    }
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router}/>
    </StrictMode>,
);