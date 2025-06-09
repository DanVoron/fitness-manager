import { useState, useEffect } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Lock, LogIn, User } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

// Интерфейс для декодированного токена
interface DecodedToken {
	role: string;
	[key: string]: any;
}

export default function LoginPage() {
	const [login, setLogin] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const navigate = useNavigate()

	// Функция для определения перенаправления
	const getRedirectPath = (role: string) => {
		if (role === 'Пользователь') {
			return '/MyProgress'
		} else if (role === 'Админ' || role === 'Тренер') {
			return '/UserProgressDashboard'
		}
		// По умолчанию для неизвестных ролей
		return '/UserProgressDashboard'
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError('')

		try {
			// Отправляем запрос авторизации через axios
			const response = await axios.post('http://94.156.112.206:5100/api/login', {
				login,
				password
			})

			// Проверяем наличие токена в ответе
			if (response.data && response.data.token) {
				// Сохраняем токен в localStorage
				localStorage.setItem('authToken', response.data.token)

				// Добавляем токен в заголовки axios по умолчанию
				axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`

				// Декодируем токен для определения роли
				const decodedToken: DecodedToken = jwtDecode(response.data.token)
				const userRole = decodedToken.role

				// Перенаправляем в зависимости от роли
				const redirectPath = getRedirectPath(userRole)
				navigate(redirectPath)
			} else {
				throw new Error('Токен авторизации не получен')
			}
		} catch (err: any) {
			// Обрабатываем разные типы ошибок
			if (err.response) {
				// Ошибка от сервера (4xx, 5xx)
				setError(err.response.data || 'Неверный логин или пароль')
			} else if (err.request) {
				// Запрос был сделан, но ответ не получен
				setError('Сервер не ответил. Проверьте подключение к интернету')
			} else {
				// Другие ошибки
				setError(err.message || 'Произошла ошибка')
			}
		} finally {
			setIsLoading(false)
		}
	}

	// Проверка авторизации при загрузке
	useEffect(() => {
		const token = localStorage.getItem('authToken')
		if (token) {
			try {
				// Декодируем токен для определения роли
				const decodedToken: DecodedToken = jwtDecode(token)
				const userRole = decodedToken.role

				// Перенаправляем в зависимости от роли
				const redirectPath = getRedirectPath(userRole)
				navigate(redirectPath)
			} catch (error) {
				console.error('Ошибка декодирования токена:', error)
				localStorage.removeItem('authToken')
			}
		}
	}, [navigate])

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md"
			>
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold mb-2" style={{ color: '#202439' }}>
						Добро пожаловать в DDX Training
					</h1>
					<p className="text-gray-600" style={{ color: '#275C73' }}>
						Введите свои данные для входа в систему
					</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="login"
								className="block text-sm font-medium mb-1"
								style={{ color: '#202439' }}
							>
								Логин
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User className="h-5 w-5" style={{ color: '#E57035' }} />
								</div>
								<Input
									id="login"
									type="text"
									placeholder="Ваш логин"
									value={login}
									onChange={(e) => setLogin(e.target.value)}
									required
									className="pl-10"
									style={{ borderColor: '#275C73' }}
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium mb-1"
								style={{ color: '#202439' }}
							>
								Пароль
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5" style={{ color: '#E57035' }} />
								</div>
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="pl-10"
									style={{ borderColor: '#275C73' }}
								/>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<input
									id="remember-me"
									name="remember-me"
									type="checkbox"
									className="h-4 w-4 rounded"
									style={{ borderColor: '#275C73', color: '#E57035' }}
								/>
								<label
									htmlFor="remember-me"
									className="ml-2 block text-sm"
									style={{ color: '#202439' }}
								>
									Запомнить меня
								</label>
							</div>
						</div>

						<div className="pt-2">
							<Button
								type="submit"
								className="w-full flex justify-center"
								style={{ backgroundColor: '#E57035' }}
								disabled={isLoading}
							>
								{isLoading ? (
									<div className="flex items-center">
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Вход...
									</div>
								) : (
									<div className="flex items-center">
										<LogIn className="h-5 w-5 mr-2" />
										Войти
									</div>
								)}
							</Button>
						</div>
					</div>
				</form>
			</motion.div>
		</div>
	)
}