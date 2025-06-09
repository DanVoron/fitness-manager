import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar, Edit, Trash, User, ArrowLeft, Check, Plus, Users, X, Video } from "lucide-react";
import { Badge } from "./ui/badge";

const BASE_URL = 'http://94.156.112.206:5100';

type Exercise = {
	id: number;
	name: string;
	description: string;
	durationRepeat: string;
	approach: number;
	calories: number;
	demonstrationExercise: string;
};

type TrainingSession = {
	id: number;
	name: string;
	type: string;
	description: string;
	duration: string;
	place: string;
	exercises: Exercise[];
};

const TrainingManagement = () => {
	const [sessions, setSessions] = useState<TrainingSession[]>([]);
	const [currentView, setCurrentView] = useState<'list' | 'create' | 'details'>('list');
	const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		type: '',
		description: '',
		duration: '',
		place: '',
	});
	const [exerciseForm, setExerciseForm] = useState({
		name: '',
		description: '',
		durationReps: '',
		sets: '',
		calories: '',
		videoLink: ''
	});
	const [exercises, setExercises] = useState<Exercise[]>([]);
	const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Загрузка тренировок с сервера
	const fetchWorkouts = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const token = localStorage.getItem('authToken');
			const response = await axios.get(`${BASE_URL}/api/Workout`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			// Гарантируем наличие exercises для каждой тренировки
			const normalizedSessions = response.data.map((session: any) => ({
				...session,
				exercises: session.exercises || [] // Добавляем пустой массив если exercises отсутствует
			}));

			setSessions(normalizedSessions);
		} catch (err) {
			console.error('Ошибка при загрузке тренировок:', err);
			setError('Не удалось загрузить тренировки');
		} finally {
			setIsLoading(false);
		}
	};


	useEffect(() => {
		fetchWorkouts();
	}, []);

	// Обработчики изменения данных в формах
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleExerciseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setExerciseForm(prev => ({ ...prev, [name]: value }));
	};

	// Управление упражнениями
	const handleAddExercise = () => {
		if (!exerciseForm.name || !exerciseForm.durationReps) {
			alert('Название и длительность/повторения обязательны');
			return;
		}

		const newExercise: Exercise = {
			id: editingExerciseId || 0,
			name: exerciseForm.name,
			description: exerciseForm.description,
			durationRepeat: exerciseForm.durationReps,
			approach: parseInt(exerciseForm.sets) || 0,
			calories: parseInt(exerciseForm.calories) || 0,
			demonstrationExercise: exerciseForm.videoLink
		};

		if (editingExerciseId) {
			setExercises(exercises.map(ex =>
				ex.id === editingExerciseId ? newExercise : ex
			));
		} else {
			setExercises([...exercises, newExercise]);
		}

		setExerciseForm({
			name: '',
			description: '',
			durationReps: '',
			sets: '',
			calories: '',
			videoLink: ''
		});
		setEditingExerciseId(null);
	};

	const handleEditExercise = (exercise: Exercise) => {
		setExerciseForm({
			name: exercise.name,
			description: exercise.description,
			durationReps: exercise.durationRepeat,
			sets: exercise.approach.toString(),
			calories: exercise.calories.toString(),
			videoLink: exercise.demonstrationExercise
		});
		setEditingExerciseId(exercise.id);
	};

	const handleDeleteExercise = (id: number) => {
		setExercises(exercises.filter(ex => ex.id !== id));
		if (editingExerciseId === id) {
			setExerciseForm({
				name: '',
				description: '',
				durationReps: '',
				sets: '',
				calories: '',
				videoLink: ''
			});
			setEditingExerciseId(null);
		}
	};

	// CRUD операции для тренировок
	const handleCreateSession = async (e: React.FormEvent) => {
		e.preventDefault();

		const workoutData = {
			name: formData.name,
			type: formData.type,
			place: formData.place,
			duration: formData.duration,
			description: formData.description,
			exercises: exercises.map(ex => ({
				name: ex.name,
				description: ex.description,
				durationRepeat: ex.durationRepeat,
				approach: ex.approach,
				calories: ex.calories,
				demonstrationExercise: ex.demonstrationExercise
			}))
		};

		try {
			const token = localStorage.getItem('authToken');
			let response;

			if (currentSession) {
				// Обновление существующей тренировки
				response = await axios.put(
					`${BASE_URL}/api/Workout/${currentSession.id}`,
					workoutData,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json'
						}
					}
				);
			} else {
				// Создание новой тренировки
				response = await axios.post(
					`${BASE_URL}/api/Workout`,
					workoutData,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json'
						}
					}
				);
			}

			// Обновляем состояние после успешного запроса
			if (currentSession) {
				setSessions(sessions.map(session =>
					session.id === currentSession.id ? response.data : session
				));
			} else {
				setSessions([...sessions, response.data]);
			}

			// Сброс состояний
			setCurrentSession(null);
			setExercises([]);
			setFormData({
				name: '',
				type: '',
				description: '',
				duration: '',
				place: '',
			});
			fetchWorkouts()
			setCurrentView('list');
		} catch (err) {
			console.error('Ошибка при сохранении тренировки:', err);
			alert('Не удалось сохранить тренировку');
		}
	};

	const handleDeleteSession = async (id: number) => {
		if (!confirm('Вы уверены, что хотите удалить эту тренировку?')) return;

		try {
			const token = localStorage.getItem('authToken');
			await axios.delete(`${BASE_URL}/api/Workout/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			setSessions(sessions.filter(session => session.id !== id));
		} catch (err) {
			console.error('Ошибка при удалении тренировки:', err);
			alert('Не удалось удалить тренировку');
		}
	};

	const handleEdit = (session: TrainingSession) => {
		setCurrentSession(session);
		setFormData({
			name: session.name,
			type: session.type,
			description: session.description,
			duration: session.duration,
			place: session.place,
		});
		setExercises([...session.exercises]);
		setCurrentView('create');
	};

	const handleViewDetails = (session: TrainingSession) => {
		setCurrentSession(session);
		setCurrentView('details');
	};

	return (
		<div className="p-6 container mx-auto px-4 sm:px-6 max-w-6xl">
			{currentView === 'create' ? (
				<div>
					<Button
						variant="outline"
						onClick={() => setCurrentView('list')}
						className="mb-4"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Назад к списку
					</Button>
					<Card>
						<CardHeader>
							<CardTitle className="text-orange-600">
								{currentSession ? 'Редактировать тренировку' : 'Создать новую тренировку'}
							</CardTitle>
							<CardDescription>
								{currentSession ? 'Обновите детали тренировки' : 'Заполните форму для создания новой тренировки'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleCreateSession} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<div>
											<Label htmlFor="name">Название тренировки *</Label>
											<Input
												id="name"
												name="name"
												value={formData.name}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div>
											<Label htmlFor="type">Тип тренировки *</Label>
											<Input
												id="type"
												name="type"
												value={formData.type}
												onChange={handleInputChange}
												required
												placeholder="Кроссфит, Йога, Силовая и т.д."
											/>
										</div>
										<div>
											<Label htmlFor="place">Место проведения *</Label>
											<Input
												id="place"
												name="place"
												value={formData.place}
												onChange={handleInputChange}
												required
											/>
										</div>
									</div>

									<div className="space-y-4">
										<div>
											<Label htmlFor="duration">Длительность *</Label>
											<Input
												id="duration"
												name="duration"
												placeholder="2 часа"
												value={formData.duration}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div>
											<Label htmlFor="description">Описание *</Label>
											<Textarea
												id="description"
												name="description"
												value={formData.description}
												onChange={handleInputChange}
												required
												rows={3}
												placeholder="Опишите детали тренировки"
											/>
										</div>
									</div>
								</div>

								{/* Конструктор упражнений */}
								<div className="border-t pt-6 mt-6">
									<h3 className="text-lg font-medium mb-4">Конструктор упражнений</h3>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-4">
											<div>
												<Label htmlFor="exerciseName">Название упражнения *</Label>
												<Input
													id="exerciseName"
													name="name"
													value={exerciseForm.name}
													onChange={handleExerciseInputChange}
													placeholder="Приседания, Отжимания и т.д."
												/>
											</div>
											<div>
												<Label htmlFor="exerciseDescription">Описание упражнения</Label>
												<Textarea
													id="exerciseDescription"
													name="description"
													value={exerciseForm.description}
													onChange={handleExerciseInputChange}
													rows={2}
													placeholder="Техника выполнения, особенности"
												/>
											</div>
											<div>
												<Label htmlFor="durationReps">Длительность/Повторения *</Label>
												<Input
													id="durationReps"
													name="durationReps"
													value={exerciseForm.durationReps}
													onChange={handleExerciseInputChange}
													placeholder="10 минут, 15 повторений"
												/>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<Label htmlFor="sets">Подходы</Label>
												<Input
													id="sets"
													name="sets"
													type="number"
													value={exerciseForm.sets}
													onChange={handleExerciseInputChange}
													placeholder="Количество подходов"
												/>
											</div>
											<div>
												<Label htmlFor="calories">Калории</Label>
												<Input
													id="calories"
													name="calories"
													type="number"
													value={exerciseForm.calories}
													onChange={handleExerciseInputChange}
													placeholder="Ожидаемое потребление калорий"
												/>
											</div>
											<div>
												<Label htmlFor="videoLink">Ссылка на видео</Label>
												<Input
													id="videoLink"
													name="videoLink"
													value={exerciseForm.videoLink}
													onChange={handleExerciseInputChange}
													placeholder="https://example.com/video"
												/>
											</div>
										</div>
									</div>

									<div className="flex justify-end mt-4">
										<Button
											type="button"
											onClick={handleAddExercise}
											className="bg-orange-600 hover:bg-orange-700"
										>
											{editingExerciseId ? 'Обновить упражнение' : 'Добавить упражнение'}
										</Button>
									</div>

									{/* Список добавленных упражнений */}
									{exercises.length > 0 && (
										<div className="mt-6 border rounded-lg p-4">
											<h4 className="font-medium mb-3">Добавленные упражнения:</h4>
											<div className="space-y-3">
												{exercises.map((exercise) => (
													<div key={exercise.id} className="border p-3 rounded-md flex justify-between items-center">
														<div>
															<div className="font-medium">{exercise.name}</div>
															<div className="text-sm text-gray-600">{exercise.description}</div>
															<div className="flex gap-3 mt-1">
																<span className="text-sm">Длит: {exercise.durationRepeat}</span>
																<span className="text-sm">Подходы: {exercise.approach}</span>
																<span className="text-sm">Калории: {exercise.calories}</span>
															</div>
															{exercise.demonstrationExercise && (
																<a
																	href={exercise.demonstrationExercise}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-blue-600 text-sm flex items-center mt-1"
																>
																	<Video className="h-4 w-4 mr-1" /> Видео
																</a>
															)}
														</div>
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleEditExercise(exercise)}
																className="text-orange-600"
															>
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleDeleteExercise(exercise.id)}
																className="text-red-600"
															>
																<Trash className="h-4 w-4" />
															</Button>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>

								<CardFooter className="flex justify-end gap-4 px-0 pb-0 mt-6">
									<Button
										variant="outline"
										type="button"
										onClick={() => setCurrentView('list')}
									>
										Отмена
									</Button>
									<Button
										type="submit"
										className="bg-orange-600 hover:bg-orange-700"
										disabled={exercises.length === 0}
									>
										{currentSession ? 'Сохранить изменения' : 'Создать тренировку'}
									</Button>
								</CardFooter>
							</form>
						</CardContent>
					</Card>
				</div>
			) : currentView === 'details' && currentSession ? (
				<div>
					<Button
						variant="outline"
						onClick={() => setCurrentView('list')}
						className="mb-4"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Назад к списку
					</Button>
					<Card>
						<CardHeader>
							<CardTitle className="text-orange-600">{currentSession.name}</CardTitle>
							<CardDescription>{currentSession.description}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<Label>Тип тренировки</Label>
									<p className="font-medium">{currentSession.type}</p>
								</div>
								<div>
									<Label>Длительность</Label>
									<p className="font-medium">{currentSession.duration}</p>
								</div>
								<div>
									<Label>Место проведения</Label>
									<p className="font-medium">{currentSession.place}</p>
								</div>
							</div>

							<div>
								<Label>Упражнения</Label>
								<ul className="mt-4 space-y-4">
									{currentSession.exercises.map((exercise) => (
										<li key={exercise.id} className="border p-4 rounded-lg">
											<div className="font-medium text-lg">{exercise.name}</div>
											{exercise.description && (
												<p className="text-gray-600 mt-1">{exercise.description}</p>
											)}
											<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
												<div>
													<Label>Длительность/Повторения</Label>
													<p>{exercise.durationRepeat}</p>
												</div>
												<div>
													<Label>Подходы</Label>
													<p>{exercise.approach}</p>
												</div>
												<div>
													<Label>Калории</Label>
													<p>{exercise.calories}</p>
												</div>
											</div>
											{exercise.demonstrationExercise && (
												<div className="mt-3">
													<Label>Видео демонстрация</Label>
													<a
														href={exercise.demonstrationExercise}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-600 hover:underline flex items-center"
													>
														<Video className="h-4 w-4 mr-1" /> Смотреть видео
													</a>
												</div>
											)}
										</li>
									))}
								</ul>
							</div>
						</CardContent>
						<CardFooter className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => handleEdit(currentSession)}
								className="text-orange-600 border-orange-600"
							>
								<Edit className="mr-2 h-4 w-4" />
								Редактировать
							</Button>
						</CardFooter>
					</Card>
				</div>
			) : (
				<>
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-gray-800">Управление тренировками</h2>
						<div className="flex gap-2">
							<Button
								onClick={() => {
									setCurrentSession(null);
									setCurrentView('create');
									setFormData({
										name: '',
										type: '',
										description: '',
										duration: '',
										place: '',
									});
									setExercises([]);
								}}
								className="bg-orange-600 hover:bg-orange-700"
							>
								<Plus className="h-4 w-4 mr-1" />
								Создать тренировку
							</Button>
						</div>
					</div>

					{isLoading ? (
						<div className="text-center py-12">
							<p>Загрузка тренировок...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500 mb-4">{error}</p>
							<Button onClick={fetchWorkouts}>Повторить попытку</Button>
						</div>
					) : (
						<div className="space-y-4">
							{sessions.length > 0 ? (
								sessions.map(session => (
									<Card key={session.id} className="hover:shadow-md transition-shadow">
										<CardContent className="p-6">
											<div className="flex flex-col md:flex-row md:justify-between gap-4">
												<div className="space-y-3 flex-1">
													<div className="flex items-start justify-between">
														<h3 className="text-xl font-bold text-gray-800">{session.name}</h3>
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleEdit(session)}
																className="text-orange-600"
															>
																<Edit className="h-4 w-4 mr-1" />
																<span className="sr-only">Редактировать</span>
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleDeleteSession(session.id)}
																className="text-red-600"
															>
																<Trash className="h-4 w-4 mr-1" />
																<span className="sr-only">Удалить</span>
															</Button>
														</div>
													</div>

													<div className="flex items-center gap-2">
														<Badge variant="outline">
															{session.type}
														</Badge>
													</div>

													<p className="text-gray-600">{session.description}</p>

													<div className="flex flex-wrap gap-2">
														<Badge variant="outline">
															{session.duration}
														</Badge>
														<Badge variant="outline">
															{session.place}
														</Badge>
														<Badge variant="outline">
															{session.exercises.length} упражнений
														</Badge>
													</div>
												</div>

												<div className="flex-shrink-0">
													<Button
														onClick={() => handleViewDetails(session)}
														variant="outline"
														className="border-orange-600 text-orange-600 hover:bg-orange-50"
													>
														Подробнее
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))
							) : (
								<Card>
									<CardContent className="py-12 text-center">
										<Users className="h-10 w-10 mx-auto text-gray-400 mb-4" />
										<h3 className="text-lg font-medium text-gray-600">Нет тренировок</h3>
										<p className="text-gray-500 mt-2">
											Создайте свою первую тренировку, нажав на кнопку выше
										</p>
									</CardContent>
								</Card>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default TrainingManagement;