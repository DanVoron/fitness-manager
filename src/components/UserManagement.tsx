import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Trash, Edit, User, Plus, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select"

const API_URL = 'http://94.156.112.206:5100';

// Типы данных
interface DecodedToken {
	role: string;
	[key: string]: any;
}

interface User {
	id: number;
	fullName: string;
	login: string;
	email: string;
	roleId: number;
}

interface Role {
	id: number;
	name: string;
}

export default function UsersManagement() {
	const token = localStorage.getItem('authToken');
	if (!token) {
		return <Navigate to="/" replace />;
	}

	const decoded: DecodedToken = jwtDecode(token);
	const userRole = decoded.role;

	// Проверка прав доступа
	if (userRole !== 'Админ') {
		return (
			<div className="p-6 text-center">
				<h2 className="text-xl font-bold" style={{ color: '#E57035' }}>Доступ запрещен</h2>
				<p className="mt-4">У вас недостаточно прав для просмотра этой страницы</p>
			</div>
		);
	}

	const [users, setUsers] = useState<User[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState<number | null>(null);

	const [newUser, setNewUser] = useState({
		fullName: '',
		login: '',
		password: '',
		email: '',
		roleId: 0
	});

	// Конфигурация Axios с JWT
	const api = axios.create({
		baseURL: API_URL,
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	// Загрузка данных
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				// Загрузка пользователей
				const usersResponse = await api.get('/api/User');
				setUsers(usersResponse.data);

				// Загрузка ролей (предполагая, что есть API для получения ролей)
				// Если нет API для ролей, используем фиксированный список
				try {
					const rolesResponse = await api.get('/api/Role'); // Замените на реальный эндпоинт
					setRoles(rolesResponse.data);
				} catch (rolesError) {
					console.warn('Не удалось загрузить роли, используется фиксированный список');
					setRoles([
						{ id: 1, name: 'Администратор' },
						{ id: 2, name: 'Тренер' },
						{ id: 3, name: 'Пользователь' }
					]);
				}

			} catch (err) {
				handleApiError(err, 'Ошибка загрузки данных');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleApiError = (error: any, defaultMessage: string) => {
		if (error.response) {
			if (error.response.status === 401) {
				localStorage.removeItem('authToken');
				window.location.reload();
			} else {
				setError(error.response.data || defaultMessage);
			}
		} else {
			setError(defaultMessage);
		}
		console.error(error);
	};

	// Создание пользователя
	const handleCreate = async () => {
		try {
			const formData = new FormData();
			formData.append('Login', newUser.login);
			formData.append('Password', newUser.password);
			formData.append('FullName', newUser.fullName);
			formData.append('Email', newUser.email);
			formData.append('RoleId', newUser.roleId.toString());

			const response = await api.post('/api/User', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			// Обновляем список пользователей
			const updatedResponse = await api.get('/api/User');
			setUsers(updatedResponse.data);

			setNewUser({ fullName: '', login: '', password: '', email: '', roleId: roles[0]?.id || 0 });
			setIsCreateModalOpen(false);
		} catch (err) {
			handleApiError(err, 'Ошибка создания пользователя');
		}
	};

	// Обновление пользователя
	const handleUpdate = async () => {
		if (!currentUser) return;

		try {
			const formData = new FormData();
			formData.append('Login', currentUser.login);
			formData.append('FullName', currentUser.fullName);
			formData.append('Email', currentUser.email);
			formData.append('RoleId', currentUser.roleId.toString());

			await api.put(`/api/User/${currentUser.id}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			// Обновляем список пользователей
			const updatedResponse = await api.get('/api/User');
			setUsers(updatedResponse.data);

			setIsEditModalOpen(false);
		} catch (err) {
			handleApiError(err, 'Ошибка обновления пользователя');
		}
	};

	// Удаление пользователя
	const handleDelete = async (id: number) => {
		try {
			setIsDeleting(id);
			await api.delete(`/api/User/${id}`);

			// Обновляем список пользователей
			const updatedResponse = await api.get('/api/User');
			setUsers(updatedResponse.data);
		} catch (err) {
			handleApiError(err, 'Ошибка удаления пользователя');
		} finally {
			setIsDeleting(null);
		}
	};

	const getRoleName = (roleId: number) => {
		return roles.find(r => r.id === roleId)?.name || 'Неизвестно';
	};

	if (loading) return <div className="p-6 text-center">Загрузка данных...</div>;
	if (error) return <div className="p-6 text-center text-red-500">Ошибка: {error}</div>;

	return (
		<div className="p-6">
			<Card className="max-w-6xl mx-auto">
				<CardHeader className="border-b">
					<div className="flex justify-between items-center">
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" style={{ color: '#E57035' }} />
							<span>Управление пользователями</span>
						</CardTitle>
						<Button
							onClick={() => setIsCreateModalOpen(true)}
							style={{ backgroundColor: '#E57035' }}
							className="hover:bg-[#c45a28]"
						>
							<Plus className="h-4 w-4 mr-2" />
							Добавить пользователя
						</Button>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{/* Список пользователей */}
					<div className="divide-y">
						{users.length === 0 ? (
							<div className="p-6 text-center">
								<p>Пользователи не найдены</p>
							</div>
						) : (
							users.map((user) => (
								<div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
									<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
										<div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
											<div className="font-medium" style={{ color: '#202439' }}>{user.fullName}</div>
											<div style={{ color: '#275C73' }}>{user.email}</div>
											<div style={{ color: '#275C73' }}>{user.login}</div>
											<div>
                        <span
							className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
							style={{ backgroundColor: '#E57035', color: 'white' }}
						>
                          {getRoleName(user.roleId)}
                        </span>
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setCurrentUser(user);
													setIsEditModalOpen(true);
												}}
												style={{ borderColor: '#275C73', color: '#275C73' }}
											>
												<Edit className="h-4 w-4 mr-2" />
												Редактировать
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDelete(user.id)}
												disabled={isDeleting === user.id}
												style={{ borderColor: '#dc2626', color: '#dc2626' }}
											>
												{isDeleting === user.id ? (
													'Удаление...'
												) : (
													<>
														<Trash className="h-4 w-4 mr-2" />
														Удалить
													</>
												)}
											</Button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* Модальное окно создания */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<User style={{ color: '#E57035' }} className="h-5 w-5" />
							Добавить нового пользователя
						</DialogTitle>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">ФИО</label>
							<Input
								value={newUser.fullName}
								onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Логин</label>
							<Input
								value={newUser.login}
								onChange={(e) => setNewUser({...newUser, login: e.target.value})}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Пароль</label>
							<Input
								type="password"
								value={newUser.password}
								onChange={(e) => setNewUser({...newUser, password: e.target.value})}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Email</label>
							<Input
								type="email"
								value={newUser.email}
								onChange={(e) => setNewUser({...newUser, email: e.target.value})}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Роль</label>
							<Select
								value={newUser.roleId.toString()}
								onValueChange={(value) => setNewUser({...newUser, roleId: parseInt(value)})}
							>
								<SelectTrigger>
									<SelectValue placeholder="Выберите роль" />
								</SelectTrigger>
								<SelectContent>
									{roles.map((role) => (
										<SelectItem key={role.id} value={role.id.toString()}>
											{role.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateModalOpen(false)}
							style={{ borderColor: '#275C73', color: '#275C73' }}
						>
							Отмена
						</Button>
						<Button
							onClick={handleCreate}
							style={{ backgroundColor: '#275C73' }}
							className="hover:bg-[#1e4a5a]"
						>
							Создать
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Модальное окно редактирования */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Edit style={{ color: '#E57035' }} className="h-5 w-5" />
							Редактирование пользователя
						</DialogTitle>
					</DialogHeader>

					{currentUser && (
						<>
							<div className="grid gap-4 py-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">ФИО</label>
									<Input
										value={currentUser.fullName}
										onChange={(e) => setCurrentUser({...currentUser, fullName: e.target.value})}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Логин</label>
									<Input
										value={currentUser.login}
										onChange={(e) => setCurrentUser({...currentUser, login: e.target.value})}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Email</label>
									<Input
										type="email"
										value={currentUser.email}
										onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Роль</label>
									<Select
										value={currentUser.roleId.toString()}
										onValueChange={(value) => setCurrentUser({...currentUser, roleId: parseInt(value)})}
									>
										<SelectTrigger>
											<SelectValue placeholder="Выберите роль" />
										</SelectTrigger>
										<SelectContent>
											{roles.map((role) => (
												<SelectItem key={role.id} value={role.id.toString()}>
													{role.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsEditModalOpen(false)}
									style={{ borderColor: '#275C73', color: '#275C73' }}
								>
									Отмена
								</Button>
								<Button
									onClick={handleUpdate}
									style={{ backgroundColor: '#275C73' }}
									className="hover:bg-[#1e4a5a]"
								>
									Сохранить
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}