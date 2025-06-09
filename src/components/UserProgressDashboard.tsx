import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Search,
	Users,
	Calendar,
	Check,
	ClipboardList,
	X
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import { Navigate } from 'react-router-dom';

// Исправленные типы данных
type User = {
	id: number;
	fullName: string;
	email: string;
	roleId: number;
};

type WorkoutDto = {
	id: number;
	name: string;
	type: string;
	place: string;
	duration: string;
	description: string;
	exercises: ExerciseDto[];
};

type ExerciseDto = {
	id: number;
	name: string;
	description: string;
	durationRepeat: string;
	approach: number;
	calories: number;
	demonstrationExercise: string;
};

type UserWorkoutDto = {
	assignmentId: number;
	workoutName: string;
	assignedDateTime: string;
	place: string;
	duration: string;
	description: string;
	isCompleted: boolean;
	exercises: ExerciseDto[];
};

type CreateAssignmentDto = {
	userId: number;
	workoutTemplateId: number;
	assignedDateTime: string;
};

type DecodedToken = {
	role: string;
	[key: string]: any;
};

const UserProgressDashboard = () => {
	// Проверка аутентификации
	const token = localStorage.getItem('authToken');
	if (!token) {
		return <Navigate to="/" replace />;
	}

	const decoded: DecodedToken = jwtDecode(token);
	const userRole = decoded.role;

	// Состояния
	const [users, setUsers] = useState<User[]>([]);
	const [workouts, setWorkouts] = useState<WorkoutDto[]>([]);
	const [assignedWorkouts, setAssignedWorkouts] = useState<UserWorkoutDto[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState({
		users: false,
		workouts: false,
		assignments: false
	});
	const [error, setError] = useState<string | null>(null);

	// Состояния для назначения тренировки
	const [assignSessionModal, setAssignSessionModal] = useState(false);
	const [sessionSearchTerm, setSessionSearchTerm] = useState('');
	const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
	const [sessionDate, setSessionDate] = useState('');
	const [sessionTime, setSessionTime] = useState('');

	// Заголовки для запросов
	const headers = {
		Authorization: `Bearer ${token}`
	};

	// Загрузка пользователей
	const fetchUsers = async () => {
		setIsLoading(prev => ({ ...prev, users: true }));
		setError(null);
		try {
			const response = await axios.get('http://94.156.112.206:5100/api/User', { headers });
			setUsers(response.data);
		} catch (error) {
			console.error('Ошибка загрузки пользователей:', error);
			setError('Не удалось загрузить пользователей');
		} finally {
			setIsLoading(prev => ({ ...prev, users: false }));
		}
	};

	// Загрузка тренировок
	const fetchWorkouts = async () => {
		setIsLoading(prev => ({ ...prev, workouts: true }));
		setError(null);
		try {
			const response = await axios.get('http://94.156.112.206:5100/api/Workout', { headers });
			setWorkouts(response.data);
		} catch (error) {
			console.error('Ошибка загрузки тренировок:', error);
			setError('Не удалось загрузить тренировки');
		} finally {
			setIsLoading(prev => ({ ...prev, workouts: false }));
		}
	};

	// Загрузка назначенных тренировок
	const fetchAssignedWorkouts = async (userId: number) => {
		if (!userId) return;

		setIsLoading(prev => ({ ...prev, assignments: true }));
		setError(null);
		try {
			const response = await axios.get(
				`http://94.156.112.206:5100/api/WorkoutAssignment/user/${userId}`,
				{ headers }
			);
			setAssignedWorkouts(response.data);
		} catch (error) {
			console.error('Ошибка загрузки назначенных тренировок:', error);
			setError('Не удалось загрузить назначенные тренировки');
		} finally {
			setIsLoading(prev => ({ ...prev, assignments: false }));
		}
	};

	// Назначение тренировки
	const assignWorkouts = async (dtos: CreateAssignmentDto[]) => {
		try {
			await axios.post(
				'http://94.156.112.206:5100/api/WorkoutAssignment',
				{ assignments: dtos }, // Правильный формат данных
				{ headers }
			);
			return true;
		} catch (error) {
			console.error('Ошибка назначения тренировок:', error);
			setError('Ошибка назначения тренировок');
			return false;
		}
	};

	// Удаление назначения
	const deleteAssignment = async (assignmentId: number) => {
		try {
			await axios.delete(
				`http://94.156.112.206:5100/api/WorkoutAssignment/${assignmentId}`,
				{ headers }
			);
			return true;
		} catch (error) {
			console.error('Ошибка удаления назначения:', error);
			setError('Ошибка удаления назначения');
			return false;
		}
	};

	// Загрузка данных при монтировании
	useEffect(() => {
		fetchUsers();
		fetchWorkouts();
	}, []);

	// Загрузка назначенных тренировок при выборе пользователя
	useEffect(() => {
		if (selectedUser) {
			fetchAssignedWorkouts(selectedUser.id);
		}
	}, [selectedUser]);

	// Фильтрация пользователей
	const filteredUsers = users.filter(user => {
		const searchLower = searchTerm.toLowerCase();
		return (
			user.fullName.toLowerCase().includes(searchLower) ||
			user.email.toLowerCase().includes(searchLower)
		);
	});

	// Фильтрация тренировок
	const filteredWorkouts = workouts.filter(workout =>
		workout.name.toLowerCase().includes(sessionSearchTerm.toLowerCase())
	);

	// Расчет прогресса пользователя
	const calculateOverallProgress = (userId: number) => {
		if (!selectedUser || selectedUser.id !== userId) return 0;

		const completed = assignedWorkouts.filter(w => w.isCompleted).length;
		const total = assignedWorkouts.length;

		return total > 0 ? Math.round((completed / total) * 100) : 0;
	};

	// Форматирование даты
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	// Форматирование времени
	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// Назначение тренировки
	const handleAssignSession = async () => {
		if (!selectedUser || !selectedSessions.length || !sessionDate || !sessionTime) {
			alert('Выберите тренировку, дату и время');
			return;
		}

		// Форматируем дату без символа 'Z'
		const assignedDateTime = `${sessionDate}T${sessionTime}:00`;

		// Создаем массив DTO для отправки
		const assignmentsDto: CreateAssignmentDto[] = selectedSessions.map(workoutId => ({
			userId: selectedUser.id,
			workoutTemplateId: workoutId,
			assignedDateTime
		}));

		// Отправляем все назначения одним запросом
		const success = await assignWorkouts(assignmentsDto);

		if (success) {
			await fetchAssignedWorkouts(selectedUser.id);
			setAssignSessionModal(false);
			setSelectedSessions([]);
			setSessionDate('');
			setSessionTime('');
		} else {
			alert('Не удалось назначить тренировки');
		}
	};

	// Удаление назначения
	const handleRemoveAssignment = async (assignmentId: number) => {
		if (!selectedUser) return;

		const success = await deleteAssignment(assignmentId);
		if (success) {
			await fetchAssignedWorkouts(selectedUser.id);
		} else {
			alert('Не удалось удалить назначение');
		}
	};

	return (
		<div className="p-6 container mx-auto px-4 sm:px-6 max-w-6xl ">
			{error && (
				<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
					{error}
				</div>
			)}

			<div className="flex flex-col md:flex-row gap-6">
				{/* Боковая панель с пользователями */}
				<div className="w-full md:w-1/3 lg:w-1/4">
					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle className="text-lg">Участники</CardTitle>
							</div>
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
								<Input
									placeholder="Поиск участников..."
									className="pl-10"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
								{isLoading.users ? (
									<div className="p-4 text-center">Загрузка...</div>
								) : filteredUsers.length > 0 ? (
									filteredUsers.map(user => (
										<div
											key={user.id}
											className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-orange-50' : ''}`}
											onClick={() => setSelectedUser(user)}
										>
											<div className="flex justify-between items-start">
												<div>
													<p className="font-medium">{user.fullName}</p>
													<p className="text-sm text-gray-500">{user.email}</p>
												</div>
												<Badge variant={user.roleId === 2 ? 'default' : 'outline'}>
													{user.roleId === 2 ? 'Тренер' : 'Ученик'}
												</Badge>
											</div>

										</div>
									))
								) : (
									<div className="p-4 text-center text-gray-500">
										Пользователи не найдены
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Основная панель с деталями */}
				<div className="flex-1">
					{selectedUser ? (
						<Card>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle>{selectedUser.fullName}</CardTitle>
										<CardDescription>
											{selectedUser.roleId === 2 ? 'Тренер' : 'Ученик'}
										</CardDescription>
									</div>
									<Badge variant={selectedUser.roleId === 2 ? 'default' : 'outline'}>
										{selectedUser.roleId === 2 ? 'Тренер' : 'Ученик'}
									</Badge>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
									<div className="border rounded-lg p-4">
										<p className="text-sm text-gray-500">Email</p>
										<p className="font-medium">{selectedUser.email}</p>
									</div>

									<div className="border rounded-lg p-4 flex flex-col">
										<div className="flex justify-between">
											<p className="text-sm text-gray-500">Общий прогресс</p>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setAssignSessionModal(true)}
												>
													<ClipboardList className="h-4 w-4 mr-1" />
													Назначить
												</Button>
										</div>
										<div className="flex items-center gap-2 mt-2">
											<Progress
												value={calculateOverallProgress(selectedUser.id)}
												className="h-2 flex-1"
											/>
											<span className="text-sm font-medium">
                        {calculateOverallProgress(selectedUser.id)}%
                      </span>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{/* Назначенные тренировки */}
								{isLoading.assignments ? (
									<div className="text-center py-8">Загрузка назначенных тренировок...</div>
								) : assignedWorkouts.length > 0 ? (
									<div className="mb-8">
										<h3 className="font-semibold mb-4 flex items-center">
											<ClipboardList className="h-5 w-5 mr-2 text-orange-600" />
											Назначенные тренировки
										</h3>

										<div className="space-y-3">
											{assignedWorkouts.map(workout => (
												<div key={workout.assignmentId} className="border rounded-lg p-4 flex justify-between items-center">
													<div>
														<div className="font-medium">{workout.workoutName}</div>
														<div className="text-sm text-gray-600">
															{formatDate(workout.assignedDateTime)} в {formatTime(workout.assignedDateTime)}
														</div>
													</div>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleRemoveAssignment(workout.assignmentId)}
															className="text-red-600"
														>
															<X className="h-4 w-4" />
														</Button>
												</div>
											))}
										</div>
									</div>
								) : (
									<div className="mb-8">
										<h3 className="font-semibold mb-4 flex items-center">
											<ClipboardList className="h-5 w-5 mr-2 text-orange-600" />
											Назначенные тренировки
										</h3>
										<div className="text-center py-4 text-gray-500">
											Нет назначенных тренировок
										</div>
									</div>
								)}

								{/* Прогресс по тренировкам */}
								<h3 className="font-semibold mb-4 flex items-center">
									<Users className="h-5 w-5 mr-2 text-orange-600" />
									Прогресс по тренировкам
								</h3>

								{isLoading.assignments ? (
									<div className="text-center py-8">Загрузка прогресса...</div>
								) : assignedWorkouts.length > 0 ? (
									<div className="space-y-4">
										{assignedWorkouts.map(workout => (
											<div key={workout.assignmentId} className="border rounded-lg p-4 relative">
												{/* Добавленная кнопка удаления */}
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleRemoveAssignment(workout.assignmentId)}
														className="absolute top-2 right-2 text-red-600 p-1"
													>
														<X className="h-4 w-4" />
													</Button>

												<div className="flex justify-between items-start pr-6">
													<div>
														<h4 className="font-medium">{workout.workoutName}</h4>
														<p className="text-sm text-gray-500 flex items-center">
															<Calendar className="h-3 w-3 mr-1" />
															{formatDate(workout.assignedDateTime)}
														</p>
													</div>
													<Badge variant={workout.isCompleted ? 'default' : 'outline'}>
														{workout.isCompleted ? 'Завершено' : 'В процессе'}
													</Badge>
												</div>

												<div className="mt-3 space-y-2">
													{workout.exercises.map(exercise => (
														<div key={exercise.id} className="flex items-center">
															<div className="h-4 w-4 border rounded border-gray-300 mr-2" />
															<span>{exercise.name}</span>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-gray-500">
										Нет данных о тренировках
									</div>
								)}
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-16">
								<Users className="h-12 w-12 text-gray-400 mb-4" />
								<h3 className="text-xl font-medium text-gray-600 mb-2">Выберите участника</h3>
								<p className="text-gray-500 text-center max-w-md">
									Выберите участника из списка слева, чтобы просмотреть его прогресс по тренировкам и детальную информацию
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Модальное окно назначения тренировки */}
			{assignSessionModal && selectedUser && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<Card className="w-full max-w-2xl">
						<CardHeader>
							<CardTitle>
								Назначить тренировку для {selectedUser.fullName}
							</CardTitle>
							<CardDescription>
								Выберите тренировку и укажите дату/время
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{/* Поиск тренировок */}
								<div className="relative">
									<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Поиск тренировок..."
										className="pl-10"
										value={sessionSearchTerm}
										onChange={(e) => setSessionSearchTerm(e.target.value)}
									/>
								</div>

								{/* Список тренировок */}
								<div className="border rounded-lg max-h-60 overflow-y-auto">
									{isLoading.workouts ? (
										<div className="p-4 text-center">Загрузка тренировок...</div>
									) : filteredWorkouts.length > 0 ? (
										filteredWorkouts.map(workout => (
											<div
												key={workout.id}
												className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedSessions.includes(workout.id) ? 'bg-orange-50' : ''}`}
												onClick={() => {
													if (selectedSessions.includes(workout.id)) {
														setSelectedSessions(selectedSessions.filter(id => id !== workout.id));
													} else {
														setSelectedSessions([...selectedSessions, workout.id]);
													}
												}}
											>
												<div className="flex items-center">
													<div className={`w-5 h-5 border rounded mr-3 flex items-center justify-center ${selectedSessions.includes(workout.id) ? 'bg-orange-600 border-orange-600' : ''}`}>
														{selectedSessions.includes(workout.id) && (
															<Check className="h-4 w-4 text-white" />
														)}
													</div>
													<div>
														<p className="font-medium">{workout.name}</p>
														<p className="text-sm text-gray-500">
															{workout.exercises.length} упражнений • {workout.duration}
														</p>
													</div>
												</div>
											</div>
										))
									) : (
										<div className="p-4 text-center text-gray-500">
											Тренировки не найдены
										</div>
									)}
								</div>

								{/* Дата и время */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="sessionDate">Дата *</Label>
										<Input
											id="sessionDate"
											type="date"
											value={sessionDate}
											onChange={(e) => setSessionDate(e.target.value)}
											required
										/>
									</div>
									<div>
										<Label htmlFor="sessionTime">Время *</Label>
										<Input
											id="sessionTime"
											type="time"
											value={sessionTime}
											onChange={(e) => setSessionTime(e.target.value)}
											required
										/>
									</div>
								</div>

								<div className="flex justify-end gap-3 pt-2">
									<Button
										variant="outline"
										type="button"
										onClick={() => setAssignSessionModal(false)}
									>
										Отмена
									</Button>
									<Button
										onClick={handleAssignSession}
										disabled={!selectedSessions.length || !sessionDate || !sessionTime}
									>
										Назначить тренировку
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
};

export default UserProgressDashboard;