import React, { useState } from 'react';
import { Button } from "./components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import {
    Calendar,
    Edit,
    Trash,
    User,
    Users,
    Check,
    FileText,
    ListChecks,
    Clock,
    ArrowLeft
} from "lucide-react";

type User = {
    id: string;
    name: string;
    role: 'student' | 'trainer';
};

type TrainingTask = {
    id: string;
    description: string;
    completed: boolean;
};

type TrainingSession = {
    id: string;
    name: string;
    description: string;
    date: string;
    time: string;
    duration: string;
    location: string;
    materials: string[];
    tasks: TrainingTask[];
    assignedStudents: string[];
};

const TrainingApp = () => {
    const [isTrainer, setIsTrainer] = useState(true);
    const [currentView, setCurrentView] = useState<'list' | 'create' | 'assign'>('list');
    const [users] = useState<User[]>([
        { id: '1', name: 'Иван Петров', role: 'student' },
        { id: '2', name: 'Мария Сидорова', role: 'student' },
        { id: '3', name: 'Алексей Иванов', role: 'student' },
        { id: '4', name: 'Тренер Смит', role: 'trainer' }
    ]);

    const [sessions, setSessions] = useState<TrainingSession[]>([
        {
            id: '1',
            name: 'Основы навигации',
            description: 'Изучение базовых принципов работы с системой',
            date: '2023-11-15',
            time: '10:00',
            duration: '2 часа',
            location: 'Конференц-зал A',
            materials: ['Презентация.pdf', 'Руководство.docx'],
            tasks: [
                { id: '1', description: 'Просмотреть вводное видео', completed: false },
                { id: '2', description: 'Пройти тест на знание интерфейса', completed: false }
            ],
            assignedStudents: ['1', '2']
        }
    ]);

    const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [viewSession, setViewSession] = useState<TrainingSession | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        time: '',
        duration: '',
        location: '',
        materials: '',
        tasks: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSession = (e: React.FormEvent) => {
        e.preventDefault();

        const tasks = formData.tasks.split('\n')
            .filter(task => task.trim() !== '')
            .map(task => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                description: task.trim(),
                completed: false
            }));

        const materials = formData.materials.split('\n')
            .filter(material => material.trim() !== '')
            .map(material => material.trim());

        const newSession: TrainingSession = {
            id: Date.now().toString(),
            ...formData,
            tasks,
            materials,
            assignedStudents: []
        };

        setSessions([...sessions, newSession]);
        setCurrentSession(newSession);
        setCurrentView('assign');
        setFormData({
            name: '',
            description: '',
            date: '',
            time: '',
            duration: '',
            location: '',
            materials: '',
            tasks: ''
        });
    };

    const handleAssignStudents = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentSession) return;

        setSessions(sessions.map(session =>
            session.id === currentSession.id
                ? { ...session, assignedStudents: selectedStudents }
                : session
        ));

        setCurrentSession(null);
        setSelectedStudents([]);
        setCurrentView('list');
    };

    const handleEdit = (session: TrainingSession) => {
        setCurrentSession(session);
        setFormData({
            name: session.name,
            description: session.description,
            date: session.date,
            time: session.time,
            duration: session.duration,
            location: session.location,
            materials: session.materials.join('\n'),
            tasks: session.tasks.map(t => t.description).join('\n')
        });
        setCurrentView('create');
    };

    const handleDelete = (id: string) => {
        setSessions(sessions.filter(session => session.id !== id));
    };

    const toggleTaskCompletion = (sessionId: string, taskId: string) => {
        setSessions(sessions.map(session => {
            if (session.id === sessionId) {
                return {
                    ...session,
                    tasks: session.tasks.map(task =>
                        task.id === taskId ? { ...task, completed: !task.completed } : task
                    )
                };
            }
            return session;
        }));
    };

    const studentSessions = sessions.filter(session =>
        session.assignedStudents.includes('1')
    );

    const availableStudents = users.filter(user => user.role === 'student');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}


            {/* Main Content */}
            <main className="max-w-6xl mx-auto py-8 px-6">
                {viewSession ? (
                    <div>
                        <Button
                            variant="outline"
                            onClick={() => setViewSession(null)}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Назад к списку
                        </Button>
                        <SessionDetailView
                            session={viewSession}
                            users={users}
                            isTrainer={isTrainer}
                            onEdit={() => {
                                handleEdit(viewSession);
                                setViewSession(null);
                            }}
                            onTaskToggle={(taskId) => toggleTaskCompletion(viewSession.id, taskId)}
                        />
                    </div>
                ) : currentView === 'create' ? (
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
                                <form onSubmit={handleCreateSession} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">Название тренировки</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="location">Место проведения</Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Описание</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="date">Дата</Label>
                                            <Input
                                                id="date"
                                                name="date"
                                                type="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="time">Время</Label>
                                            <Input
                                                id="time"
                                                name="time"
                                                type="time"
                                                value={formData.time}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="duration">Длительность</Label>
                                            <Input
                                                id="duration"
                                                name="duration"
                                                placeholder="2 часа"
                                                value={formData.duration}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="tasks">Упражнения (по одной на строку)</Label>
                                        <Textarea
                                            id="tasks"
                                            name="tasks"
                                            value={formData.tasks}
                                            onChange={handleInputChange}
                                            placeholder="Просмотреть материалы...&#10;Выполнить упражнение..."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="materials">Материалы (по одному на строку)</Label>
                                        <Textarea
                                            id="materials"
                                            name="materials"
                                            value={formData.materials}
                                            onChange={handleInputChange}
                                            placeholder="Презентация.pdf&#10;Руководство.docx"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => {
                                                setCurrentSession(null);
                                                setCurrentView('list');
                                                setFormData({
                                                    name: '',
                                                    description: '',
                                                    date: '',
                                                    time: '',
                                                    duration: '',
                                                    location: '',
                                                    materials: '',
                                                    tasks: ''
                                                });
                                            }}
                                        >
                                            Отмена
                                        </Button>
                                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                                            {currentSession ? 'Обновить тренировку' : 'Создать тренировку'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                ) : currentView === 'assign' && currentSession ? (
                    <div>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentView('create')}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Назад к редактированию
                        </Button>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-orange-600">Назначить студентов</CardTitle>
                                <CardDescription>
                                    Выберите студентов для тренировки "{currentSession.name}"
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAssignStudents} className="space-y-4">
                                    <div>
                                        <Label>Выберите студентов</Label>
                                        <select
                                            multiple
                                            value={selectedStudents}
                                            onChange={(e) => {
                                                const options = e.target.options;
                                                const selected = [];
                                                for (let i = 0; i < options.length; i++) {
                                                    if (options[i].selected) {
                                                        selected.push(options[i].value);
                                                    }
                                                }
                                                setSelectedStudents(selected);
                                            }}
                                            className="w-full p-2 border rounded"
                                            size={5}
                                        >
                                            {availableStudents.map(student => (
                                                <option key={student.id} value={student.id}>
                                                    {student.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Удерживайте Ctrl (Windows) или Command (Mac) для выбора нескольких студентов
                                        </p>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => {
                                                setCurrentSession(null);
                                                setSelectedStudents([]);
                                                setCurrentView('list');
                                            }}
                                        >
                                            Отмена
                                        </Button>
                                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                                            Назначить студентов
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                ) : isTrainer ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Тренировки</h2>
                            <Button
                                onClick={() => {
                                    setCurrentSession(null);
                                    setCurrentView('create');
                                    setFormData({
                                        name: '',
                                        description: '',
                                        date: '',
                                        time: '',
                                        duration: '',
                                        location: '',
                                        materials: '',
                                        tasks: ''
                                    });
                                }}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                Создать тренировку
                            </Button>
                        </div>

                        {sessions.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <p className="text-gray-500">Тренировок пока нет.</p>
                                    <Button
                                        onClick={() => setCurrentView('create')}
                                        className="mt-4 bg-orange-600 hover:bg-orange-700"
                                    >
                                        Создать первую тренировку
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {sessions.map(session => (
                                    <Card key={session.id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="font-bold text-lg text-blue-800">{session.name}</h3>
                                                    <p className="text-gray-600">{session.description}</p>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        {new Date(session.date).toLocaleDateString()} в {session.time} ({session.duration})
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <User className="mr-2 h-4 w-4" />
                                                        {session.assignedStudents.length} студентов
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setViewSession(session)}
                                                    >
                                                        Просмотр
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(session)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(session.id)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ваши тренировки</h2>
                        {studentSessions.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <p className="text-gray-500">У вас нет назначенных тренировок.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {studentSessions.map(session => (
                                    <Card key={session.id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="font-bold text-lg text-blue-800">{session.name}</h3>
                                                    <p className="text-gray-600">{session.description}</p>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        {new Date(session.date).toLocaleDateString()} в {session.time} ({session.duration})
                                                    </div>
                                                    <div className="pt-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setViewSession(session)}
                                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                                        >
                                                            Подробнее
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="text-sm text-gray-500 mb-2">
                                                        {session.tasks.filter(t => t.completed).length} / {session.tasks.length} выполнено
                                                    </div>
                                                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                                                        <div
                                                            className="h-full rounded-full bg-orange-600"
                                                            style={{
                                                                width: `${(session.tasks.filter(t => t.completed).length / session.tasks.length) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

type SessionDetailViewProps = {
    session: TrainingSession;
    users: User[];
    isTrainer: boolean;
    onEdit: () => void;
    onTaskToggle: (taskId: string) => void;
};

const SessionDetailView = ({ session, users, isTrainer, onEdit, onTaskToggle }: SessionDetailViewProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-orange-600">{session.name}</CardTitle>
                <CardDescription>{session.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold mb-2">Детали сессии</h3>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                <span>{new Date(session.date).toLocaleDateString()} в {session.time}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                                <span>Длительность: {session.duration}</span>
                            </div>
                            <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-gray-500" />
                                <span>Место: {session.location}</span>
                            </div>
                        </div>
                    </div>
                    {isTrainer && (
                        <div>
                            <h3 className="font-semibold mb-2">Прикрепленные студенты</h3>
                            <div className="space-y-1">
                                {session.assignedStudents.map(studentId => {
                                    const student = users.find(u => u.id === studentId);
                                    return (
                                        <div key={studentId} className="flex items-center">
                                            <User className="mr-2 h-4 w-4 text-gray-500" />
                                            <span>{student?.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                        <ListChecks className="mr-2 h-4 w-4" />
                        Задачи для выполнения
                    </h3>
                    <div className="space-y-2">
                        {session.tasks.map(task => (
                            <div
                                key={task.id}
                                className={`flex items-center p-2 rounded ${task.completed ? 'bg-green-50' : 'bg-gray-50'}`}
                            >
                                <Button
                                    variant={task.completed ? 'default' : 'outline'}
                                    size="sm"
                                    className="mr-2 h-6 w-6 p-0 rounded-full bg-orange-600 hover:bg-orange-700"
                                    onClick={() => !isTrainer && onTaskToggle(task.id)}
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                  {task.description}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {session.materials.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Материалы для изучения
                        </h3>
                        <div className="space-y-1">
                            {session.materials.map((material, index) => (
                                <div key={index} className="flex items-center">
                                    <FileText className="mr-2 h-4 w-4 text-gray-500" />
                                    <a href="#" className="text-blue-600 hover:underline">{material}</a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            {isTrainer && (
                <CardFooter className="flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={onEdit}
                    >
                        Редактировать
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default TrainingApp;