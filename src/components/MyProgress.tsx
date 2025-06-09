import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter
} from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Check, Dumbbell, Flame, Activity } from "lucide-react";
import { Badge } from "./ui/badge";

// Типы данных API
type UserStatisticsDto = {
	totalWorkoutsCompleted: number;
	weeklyWorkoutsCompleted: number;
	monthlyCaloriesBurned: number;
	weeklyCaloriesBurned: number;
};

type DailyStatsDto = {
	dayOfWeek: string;
	date: string;
	caloriesBurned: number;
	workoutsCompleted: number;
};

type CompletedWorkoutDto = {
	assignmentId: number;
	workoutName: string;
	assignedDateTime: string;
	duration: string;
	caloriesBurned: number;
	isCompleted: boolean;
};

type DecodedToken = {
	role: string;
	[key: string]: any;
};

// Создаем экземпляр axios
const api = axios.create({
	baseURL: 'http://94.156.112.206:5100',
});

// Добавляем интерцептор для авторизации
api.interceptors.request.use(config => {
	const token = localStorage.getItem('authToken');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
}, error => {
	return Promise.reject(error);
});

// Функция для преобразования английских названий дней в русские сокращения
const translateDayOfWeek = (day: string): string => {
	const daysMap: Record<string, string> = {
		"Monday": "Пн",
		"Tuesday": "Вт",
		"Wednesday": "Ср",
		"Thursday": "Чт",
		"Friday": "Пт",
		"Saturday": "Сб",
		"Sunday": "Вс"
	};

	return daysMap[day] || day;
};

// Функция для получения даты в формате YYYY-MM-DD
const getISODateString = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};


const MyProgress = () => {
	// Проверка аутентификации
	const token = localStorage.getItem('authToken');
	if (!token) {
		return <Navigate to="/" replace />;
	}

	const decoded: DecodedToken = jwtDecode(token);
	const userRole = decoded.role;

	// Состояния для данных
	const [userStats, setUserStats] = useState<UserStatisticsDto | null>(null);
	const [weeklyStats, setWeeklyStats] = useState<DailyStatsDto[]>([]);
	const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkoutDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Загрузка данных с API
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				// Параллельно запрашиваем все данные
				const [statsRes, weeklyRes, completedRes] = await Promise.all([
					api.get<UserStatisticsDto>('/api/Stats'),
					api.get<DailyStatsDto[]>('/api/Stats/weekly-calories'),
					api.get<CompletedWorkoutDto[]>('/api/Stats/completed-workouts')
				]);

				setUserStats(statsRes.data);
				setWeeklyStats(weeklyRes.data);
				setCompletedWorkouts(completedRes.data);
			} catch (err) {
				console.error('Ошибка при загрузке данных:', err);
				setError('Не удалось загрузить данные. Попробуйте позже.');
			} finally {
				setLoading(false);
			}
		};

		fetchData();

	}, []);

	// Форматирование даты для отображения
	const formatDisplayDate = (dateString: string) => {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			day: 'numeric',
			month: 'short'
		};
		return date.toLocaleDateString('ru-RU', options);
	};

	// Генерация данных за последние 7 дней
	const generateLast7Days = (): { dayOfWeek: string; date: string }[] => {
		const days = [];
		const today = new Date();

		// Генерируем 7 дней: от 6 дней назад до сегодня
		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
			days.push({
				dayOfWeek,
				date: getISODateString(date),
			});
		}

		return days;
	};



	// Преобразование данных для графиков

	const getChartData = () => {
		// Проверяем наличие данных
		if (!weeklyStats || weeklyStats.length === 0) {
			return [];
		}

		// Генерируем правильный диапазон дат (последние 7 дней)
		const last7Days = generateLast7Days();

		// Для отладки: выводим полученные данные
		console.log("Weekly stats from server:", weeklyStats);
		console.log("Generated last 7 days:", last7Days);

		return last7Days.map(day => {
			// Находим соответствующий день в данных сервера
			const serverData = weeklyStats.find(d => {
				// Преобразуем серверную дату в объект Date
				const serverDate = new Date(d.date);
				// Форматируем в YYYY-MM-DD для сравнения
				const serverDateStr = getISODateString(serverDate);
				return serverDateStr === day.date;
			});

			console.log(`For day ${day.date}:`, serverData ? "found" : "not found");

			return {
				name: translateDayOfWeek(day.dayOfWeek),
				Тренировки: serverData ? serverData.workoutsCompleted : 0,
				Калории: serverData ? serverData.caloriesBurned : 0,
			};
		});
	};
	// Получаем данные для графика
	const chartData = getChartData();

	// Определяем диапазон дат для отображения
	const getDateRange = () => {
		if (chartData.length === 0) return null;

		const firstDate = generateLast7Days()[0].date;
		const lastDate = generateLast7Days()[6].date;

		return `${formatDisplayDate(firstDate)} - ${formatDisplayDate(lastDate)}`;
	};

	const dateRange = getDateRange();

	// Расчет статистики
	const totalTrainings = userStats?.totalWorkoutsCompleted || 0;
	const weeklyTrainings = userStats?.weeklyWorkoutsCompleted || 0;
	const monthlyCalories = userStats?.monthlyCaloriesBurned || 0;
	const weeklyCalories = userStats?.weeklyCaloriesBurned || 0;

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				<div className="flex justify-between items-center mb-8">
					<div className="bg-gray-200 rounded h-8 w-48 animate-pulse"></div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
					{[1, 2].map(i => (
						<Card key={i}>
							<CardHeader className="pb-2">
								<div className="bg-gray-200 rounded h-4 w-24 mb-2 animate-pulse"></div>
								<div className="bg-gray-200 rounded h-8 w-16 animate-pulse"></div>
							</CardHeader>
							<CardContent>
								<div className="bg-gray-200 rounded h-3 w-32 animate-pulse"></div>
							</CardContent>
						</Card>
					))}
				</div>

				<Card className="mb-8">
					<CardHeader>
						<div className="bg-gray-200 rounded h-6 w-48 animate-pulse"></div>
					</CardHeader>
					<CardContent className="h-80">
						<div className="bg-gray-200 rounded h-full w-full animate-pulse"></div>
					</CardContent>
				</Card>

				<div className="mb-8">
					<div className="bg-gray-200 rounded h-6 w-48 mb-4 animate-pulse"></div>
					<Card>
						{[...Array(3)].map((_, i) => (
							<div key={i} className="p-4 border-b">
								<div className="bg-gray-200 rounded h-4 w-3/4 mb-2 animate-pulse"></div>
								<div className="bg-gray-200 rounded h-3 w-1/2 animate-pulse"></div>
							</div>
						))}
					</Card>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				<div className="text-center py-12">
					<div className="text-red-500 mb-4">{error}</div>
					<Button
						variant="outline"
						onClick={() => window.location.reload()}
					>
						Повторить попытку
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-6xl">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-2xl font-bold text-gray-800 flex items-center">
					<Activity className="h-6 w-6 mr-2 text-orange-600" />
					Мой прогресс
				</h1>

			</div>

			{/* Основная статистика */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="flex items-center">
							<Dumbbell className="h-4 w-4 mr-2" />
							Тренировки
						</CardDescription>
						<CardTitle className="text-3xl">{totalTrainings}</CardTitle>
					</CardHeader>

				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="flex items-center">
							<Flame className="h-4 w-4 mr-2" />
							Калории
						</CardDescription>
						<CardTitle className="text-3xl">{monthlyCalories}</CardTitle>
					</CardHeader>

				</Card>
			</div>

			{/* График недельной активности */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="flex items-center">
						<Activity className="h-5 w-5 mr-2 text-orange-600" />
						Недельная активность
					</CardTitle>
					{dateRange && (
						<CardDescription>
							{dateRange}
						</CardDescription>
					)}
				</CardHeader>
				<CardContent className="h-80">
					{chartData.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="name" />
								<YAxis yAxisId="left" orientation="left" stroke="#E57035" domain={[0, 'dataMax + 1']} />
								<YAxis yAxisId="right" orientation="right" stroke="#275C73" domain={[0, 'dataMax + 500']} />
								<Tooltip
									formatter={(value, name) => {
										if (name === 'Калории') return [`${value} ккал`, name];
										return [value, name];
									}}
									labelFormatter={(name) => `День: ${name}`}
								/>
								<Legend />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="Тренировки"
									stroke="#E57035"
									strokeWidth={2}
									activeDot={{ r: 6 }}
									name="Кол-во тренировок"
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="Калории"
									stroke="#275C73"
									strokeWidth={2}
									name="Сожжено калорий"
								/>
							</LineChart>
						</ResponsiveContainer>
					) : (
						<div className="h-full flex items-center justify-center text-gray-500">
							Нет данных для отображения графика
						</div>
					)}
				</CardContent>
			</Card>

			{/* История тренировок */}
			<div className="mb-8">
				<h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
					<Calendar className="h-5 w-5 mr-2 text-orange-600" />
					История тренировок
				</h2>

				<Card>
					<div className="divide-y">
						{completedWorkouts.slice(0, 5).map(workout => (
							<div key={workout.assignmentId} className="p-4 hover:bg-gray-50 transition-colors">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">{workout.workoutName || 'Тренировка'}</p>
										<p className="text-sm text-gray-500">
											{formatDisplayDate(workout.assignedDateTime)} • {workout.duration} • {workout.caloriesBurned} ккал
										</p>
									</div>
									<Badge variant="outline" className="flex items-center gap-1">
										<Check className="h-3 w-3" />
										Завершено
									</Badge>
								</div>
							</div>
						))}

						{completedWorkouts.length === 0 && (
							<div className="p-8 text-center text-gray-500">
								Нет данных о тренировках
							</div>
						)}
					</div>

					{completedWorkouts.length > 5 && (
						<CardFooter className="flex justify-center border-t">
							<Button variant="ghost" className="text-orange-600">
								Показать все тренировки
							</Button>
						</CardFooter>
					)}
				</Card>
			</div>
		</div>
	);
};

export default MyProgress;