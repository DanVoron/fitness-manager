import { Button } from "./ui/button"
import { User, Users, Calendar, Home, Dumbbell, LogOut, Settings, Bookmark } from "lucide-react"
import {Link, Navigate, useNavigate} from "react-router-dom"
import React, {useState, useEffect} from "react";
import {jwtDecode} from "jwt-decode";

// Интерфейс для декодированного токена
interface DecodedToken {
	role: string;
	[key: string]: any;
}

export default function Header() {
	const navigate = useNavigate()
	const [userRole, setUserRole] = useState<string | null>(null)

	useEffect(() => {
		const token = localStorage.getItem('authToken');
		if (token) {
			try {
				const decoded: DecodedToken = jwtDecode(token);
				setUserRole(decoded.role);
			} catch (error) {
				console.error('Ошибка декодирования токена:', error);
			}
		}
	}, []);

	const handleLogout = () => {
		localStorage.removeItem('authToken');
		navigate('/')
	}

	// Показываем админское/тренерское меню для Админа и Тренера
	const isStaff = userRole === 'Админ' || userRole === 'Тренер';

	return (
		<header className="bg-white border-b sticky top-0 z-50 shadow-sm">
			<div className="container mx-auto px-4 sm:px-6 max-w-7xl">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<div className="flex items-center">
						<div className="flex items-center">
							<Dumbbell className="h-6 w-6 mr-2 text-orange-600" />
							<h1 className="text-xl font-bold text-gray-900 hidden sm:block">
								Orange Fitness
							</h1>
						</div>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-6">
						{isStaff ? (
							<>
								{userRole === 'Админ' && (
									<Link
										to="/UsersManagement"
										className="flex items-center text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors px-3 py-2 rounded-md"
									>
										<Users className="h-4 w-4 mr-2" />
										Пользователи
									</Link>
								)}
								<Link
									to="/TrainingManagement"
									className="flex items-center text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors px-3 py-2 rounded-md"
								>
									<Dumbbell className="h-4 w-4 mr-2" />
									Тренировки
								</Link>
								<Link
									to="/UserProgressDashboard"
									className="flex items-center text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors px-3 py-2 rounded-md"
								>
									<Calendar className="h-4 w-4 mr-2" />
									Расписание
								</Link>
							</>
						) : (
							<>
								<Link
									to="/MyTrainings"
									className="flex items-center text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors px-3 py-2 rounded-md"
								>
									<Bookmark className="h-4 w-4 mr-2" />
									Мои тренировки
								</Link>
								<Link
									to="/MyProgress"
									className="flex items-center text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors px-3 py-2 rounded-md"
								>
									<Calendar className="h-4 w-4 mr-2" />
									Мой прогресс
								</Link>
							</>
						)}
					</nav>

					{/* Right Side Controls */}
					<div className="flex items-center gap-4">
						<Button
							variant="outline"
							size="sm"
							onClick={handleLogout}
							className="flex items-center gap-2 text-orange-600 border-orange-600 hover:bg-orange-50"
						>
							<LogOut className="h-4 w-4" />
							<span className="hidden sm:inline">Выход</span>
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				<div className="md:hidden flex items-center justify-around py-2 border-t mt-2">
					{isStaff ? (
						<>
							{userRole === 'Админ' && (
								<Link
									to="/UsersManagement"
									className="flex flex-col items-center text-xs text-gray-700 hover:text-orange-600 transition-colors p-2 rounded-md"
								>
									<Users className="h-5 w-5 mb-1" />
									<span>Пользователи</span>
								</Link>
							)}
							<Link
								to="/TrainingManagement"
								className="flex flex-col items-center text-xs text-gray-700 hover:text-orange-600 transition-colors p-2 rounded-md"
							>
								<Dumbbell className="h-5 w-5 mb-1" />
								<span>Тренировки</span>
							</Link>
							<Link
								to="/UserProgressDashboard"
								className="flex flex-col items-center text-xs text-gray-700 hover:text-orange-600 transition-colors p-2 rounded-md"
							>
								<Calendar className="h-5 w-5 mb-1" />
								<span>Расписание</span>
							</Link>
						</>
					) : (
						<>
							<Link
								to="/MyTrainings"
								className="flex flex-col items-center text-xs text-gray-700 hover:text-orange-600 transition-colors p-2 rounded-md"
							>
								<Bookmark className="h-5 w-5 mb-1" />
								<span>Тренировки</span>
							</Link>
							<Link
								to="/MyProgress"
								className="flex flex-col items-center text-xs text-gray-700 hover:text-orange-600 transition-colors p-2 rounded-md"
							>
								<Calendar className="h-5 w-5 mb-1" />
								<span>Прогресс</span>
							</Link>
						</>
					)}
				</div>
			</div>
		</header>
	)
}