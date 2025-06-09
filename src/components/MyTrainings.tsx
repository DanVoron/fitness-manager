import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "./ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter
} from "./ui/card"
import { Calendar, Check, ChevronDown, ChevronUp, Clock, Dumbbell, Star, X, Video } from "lucide-react"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { jwtDecode } from 'jwt-decode'

// Типы данных
type Exercise = {
	id: number
	name: string
	description: string
	durationReps: string
	sets: number
	calories: number
	videoLink: string
	completed: boolean
}

type TrainingSession = {
	id: number
	name: string
	trainer: string
	date: string
	time: string
	duration: string
	location: string
	progress: number
	completed: boolean
	rating?: number
	exercises: Exercise[]
}

// Интерфейс для декодированного токена
interface DecodedToken {
	Id: string
	Login: string
	role: string
	[key: string]: any
}

// Создаем экземпляр Axios
const api = axios.create({
	baseURL: 'http://94.156.112.206:5100',
})

// Добавляем интерцептор для автоматической вставки токена
api.interceptors.request.use(config => {
	const token = localStorage.getItem('authToken')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

const MyTrainings = () => {
	const [trainings, setTrainings] = useState<TrainingSession[]>([])
	const [expandedTraining, setExpandedTraining] = useState<number | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Получение userId из токена
	const getUserId = (): number | null => {
		const token = localStorage.getItem('authToken')
		if (!token) return null

		try {
			const decoded: DecodedToken = jwtDecode(token)
			// Преобразуем строковый Id в число
			return parseInt(decoded.Id, 10)
		} catch (error) {
			console.error('Ошибка декодирования токена:', error)
			return null
		}
	}

	// Загрузка тренировок с сервера
	const loadTrainings = async () => {
		const userId = getUserId()
		if (!userId) {
			setError('Пользователь не авторизован')
			setLoading(false)
			return
		}

		try {
			// Получаем назначенные тренировки
			const response = await api.get(`/api/WorkoutAssignment/user/${userId}`)
			const assignments = response.data

			// Преобразуем данные API в формат компонента
			const transformed = assignments.map((assignment: any) => ({
				id: assignment.assignmentId,
				name: assignment.workoutName || 'Тренировка',
				trainer: 'Тренер не указан',
				date: assignment.assignedDateTime.split('T')[0],
				time: new Date(assignment.assignedDateTime).toLocaleTimeString([], {
					hour: '2-digit', minute: '2-digit'
				}),
				duration: assignment.duration || '',
				location: assignment.place || '',
				progress: assignment.isCompleted ? 100 : 0,
				completed: assignment.isCompleted,
				rating: 0,
				exercises: assignment.exercises?.map((ex: any) => ({
					id: ex.id,
					name: ex.name || 'Упражнение',
					description: ex.description || '',
					durationReps: ex.durationRepeat || '',
					sets: ex.approach,
					calories: ex.calories,
					videoLink: ex.demonstrationExercise || '',
					completed: assignment.isCompleted
				})) || []
			}))

			setTrainings(transformed)
			setError(null)
		} catch (err) {
			setError('Ошибка загрузки тренировок')
			console.error(err)
		} finally {
			setLoading(false)
		}
	}

	// Отметка тренировки как завершенной
	const completeAssignment = async (assignmentId: number) => {
		try {
			await api.put(`/api/WorkoutAssignment/complete/${assignmentId}`, {
				isCompleted: true
			})
			return true
		} catch (err) {
			console.error('Ошибка завершения тренировки:', err)
			return false
		}
	}

	useEffect(() => {
		loadTrainings()
	}, [])

	const formatDate = (dateString: string) => {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		}
		return new Date(dateString).toLocaleDateString('ru-RU', options)
	}

	const toggleExpand = (id: number) => {
		setExpandedTraining(expandedTraining === id ? null : id)
	}

	// Обновление статуса упражнения
	const toggleExerciseCompletion = async (trainingId: number, exerciseId: number) => {
		const training = trainings.find(t => t.id === trainingId)
		if (!training || training.completed) return

		try {
			// Создаем обновленный массив тренировок
			const updatedTrainings = trainings.map(t => {
				if (t.id === trainingId) {
					// Обновляем упражнения
					const updatedExercises = t.exercises.map(ex =>
						ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
					)

					// Вычисляем прогресс
					const completedCount = updatedExercises.filter(ex => ex.completed).length
					const progress = Math.round((completedCount / updatedExercises.length) * 100)
					const completed = progress === 100

					return {
						...t,
						exercises: updatedExercises,
						progress,
						completed
					}
				}
				return t
			})

			// Обновляем состояние
			setTrainings(updatedTrainings)

			// Если тренировка завершена, отправляем запрос на сервер
			if (updatedTrainings.find(t => t.id === trainingId)?.completed) {
				const success = await completeAssignment(trainingId)
				if (!success) {
					// Если запрос не удался, перезагружаем данные
					loadTrainings()
				}
			}
		} catch (err) {
			console.error('Ошибка обновления статуса:', err)
			// Восстанавливаем предыдущее состояние
			loadTrainings()
		}
	}

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-4xl text-center">
				<Dumbbell className="h-12 w-12 mx-auto animate-bounce text-orange-600" />
				<p className="mt-4 text-gray-600">Загрузка тренировок...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-4xl text-center">
				<X className="h-12 w-12 mx-auto text-red-500" />
				<p className="mt-4 text-red-500">{error}</p>
				<Button
					className="mt-4 bg-orange-600 hover:bg-orange-700"
					onClick={loadTrainings}
				>
					Повторить попытку
				</Button>
			</div>
		)
	}

	const upcomingTrainings = trainings.filter(t => !t.completed)
	const completedTrainings = trainings.filter(t => t.completed)

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-2xl font-bold text-gray-800 flex items-center">
					<Dumbbell className="h-6 w-6 mr-2 text-orange-600" />
					Мои тренировки
				</h1>
			</div>

			{/* Предстоящие тренировки */}
			<div className="mb-12">
				<h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
					<Clock className="h-5 w-5 mr-2 text-orange-600" />
					Предстоящие тренировки
				</h2>

				{upcomingTrainings.length > 0 ? (
					<div className="space-y-4">
						{upcomingTrainings.map(training => (
							<Card key={training.id} className="hover:shadow-md transition-shadow">
								<CardHeader className="pb-3">
									<div className="flex justify-between items-start">
										<div>
											<CardTitle className="text-lg">{training.name}</CardTitle>
											<CardDescription className="mt-1">
												Тренер: {training.trainer} • {formatDate(training.date)} в {training.time} • {training.location}
											</CardDescription>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => toggleExpand(training.id)}
										>
											{expandedTraining === training.id ? (
												<ChevronUp className="h-5 w-5" />
											) : (
												<ChevronDown className="h-5 w-5" />
											)}
										</Button>
									</div>
								</CardHeader>

								<CardContent className="pt-0">
									<div className="flex items-center gap-3 mb-3">
										<Progress value={training.progress} className="h-2 flex-1" />
										<span className="text-sm font-medium">{training.progress}%</span>
									</div>

									{expandedTraining === training.id && (
										<div className="space-y-4 mt-4">
											<h4 className="font-medium text-sm">Упражнения:</h4>
											<ul className="space-y-3">
												{training.exercises.map(exercise => (
													<li
														key={exercise.id}
														className="border p-3 rounded-md"
													>
														<div className="flex justify-between items-start">
															<div>
																<div className="font-medium">{exercise.name}</div>
																{exercise.description && (
																	<p className="text-gray-600 text-sm mt-1">{exercise.description}</p>
																)}
																<div className="flex gap-3 mt-2 text-sm">
																	<span>{exercise.durationReps}</span>
																	<span>Подходы: {exercise.sets}</span>
																	<span>Калории: {exercise.calories}</span>
																</div>
																{exercise.videoLink && (
																	<a
																		href={exercise.videoLink}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="text-blue-600 hover:underline text-sm flex items-center mt-2"
																	>
																		<Video className="h-4 w-4 mr-1" /> Видео
																	</a>
																)}
															</div>
															<Button
																variant={exercise.completed ? "default" : "outline"}
																size="sm"
																onClick={() => toggleExerciseCompletion(training.id, exercise.id)}
																className={exercise.completed
																	? "bg-green-600 hover:bg-green-700"
																	: "border-gray-300"
																}
															>
																{exercise.completed ? (
																	<Check className="h-4 w-4" />
																) : (
																	"Выполнить"
																)}
															</Button>
														</div>
													</li>
												))}
											</ul>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="py-8 text-center">
							<Dumbbell className="h-10 w-10 mx-auto text-gray-400 mb-4" />
							<h3 className="text-lg font-medium text-gray-600">Нет предстоящих тренировок</h3>
							<p className="text-gray-500 mt-2">
								Запишитесь на тренировку в разделе расписания
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Завершенные тренировки */}
			<div>
				<h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
					<Check className="h-5 w-5 mr-2 text-green-600" />
					Завершенные тренировки
				</h2>

				{completedTrainings.length > 0 ? (
					<div className="space-y-4">
						{completedTrainings.map(training => (
							<Card key={training.id} className="hover:shadow-md transition-shadow">
								<CardHeader className="pb-3">
									<div className="flex justify-between items-start">
										<div>
											<CardTitle className="text-lg">{training.name}</CardTitle>
											<CardDescription className="mt-1">
												Тренер: {training.trainer} • {formatDate(training.date)} • {training.location}
											</CardDescription>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => toggleExpand(training.id)}
										>
											{expandedTraining === training.id ? (
												<ChevronUp className="h-5 w-5" />
											) : (
												<ChevronDown className="h-5 w-5" />
											)}
										</Button>
									</div>
								</CardHeader>

								<CardContent className="pt-0">
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-2 w-full">
											<Progress value={100} className="h-2 w-full" />
											<span className="text-sm font-medium">100%</span>
										</div>
									</div>

									{expandedTraining === training.id && (
										<div className="space-y-4 mt-4">
											<h4 className="font-medium text-sm">Выполненные упражнения:</h4>
											<ul className="space-y-3">
												{training.exercises.map(exercise => (
													<li
														key={exercise.id}
														className="border p-3 rounded-md"
													>
														<div className="flex justify-between items-start">
															<div>
																<div className="font-medium">{exercise.name}</div>
																{exercise.description && (
																	<p className="text-gray-600 text-sm mt-1">{exercise.description}</p>
																)}
																<div className="flex gap-3 mt-2 text-sm">
																	<span>{exercise.durationReps}</span>
																	<span>Подходы: {exercise.sets}</span>
																	<span>Калории: {exercise.calories}</span>
																</div>
																{exercise.videoLink && (
																	<a
																		href={exercise.videoLink}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="text-blue-600 hover:underline text-sm flex items-center mt-2"
																	>
																		<Video className="h-4 w-4 mr-1" /> Видео
																	</a>
																)}
															</div>
															<Badge className="bg-green-600">
																<Check className="h-4 w-4 mr-1" /> Выполнено
															</Badge>
														</div>
													</li>
												))}
											</ul>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="py-8 text-center">
							<Check className="h-10 w-10 mx-auto text-gray-400 mb-4" />
							<h3 className="text-lg font-medium text-gray-600">Нет завершенных тренировок</h3>
							<p className="text-gray-500 mt-2">
								После завершения тренировки она появится здесь
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}

export default MyTrainings