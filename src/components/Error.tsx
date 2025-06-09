import { Button } from "./ui/button"
import { AlertTriangle, Home } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export default function Error() {
	const navigate = useNavigate()
	return (
		<div
			className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
			style={{ backgroundColor: '#F8F8F7' }}
		>
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className="max-w-2xl w-full"
			>
				{/* Иконка ошибки */}
				<div className="flex justify-center mb-6">
					<div className="p-4 rounded-full" style={{ backgroundColor: 'rgba(229, 112, 53, 0.1)' }}>
						<AlertTriangle className="h-16 w-16" style={{ color: '#E57035' }} />
					</div>
				</div>

				{/* Заголовок */}
				<h1
					className="text-5xl md:text-6xl font-bold mb-4"
					style={{ color: '#202439' }}
				>
					404
				</h1>

				{/* Подзаголовок */}
				<h2
					className="text-2xl md:text-3xl font-semibold mb-4"
					style={{ color: '#202439' }}
				>
					Страница не найдена
				</h2>

				{/* Описание */}
				<p
					className="text-lg mb-8 max-w-md mx-auto"
					style={{ color: '#275C73' }}
				>
					Похоже, страница, которую вы ищете, не существует или была перемещена.
				</p>

				{/* Кнопки действий */}
				<div className="flex flex-col sm:flex-row justify-center gap-4">
					<Button
						onClick={() => navigate(-1)}
						variant="outline"
						className="flex items-center gap-2"
						style={{ borderColor: '#275C73', color: '#275C73' }}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="m12 19-7-7 7-7"/>
							<path d="M19 12H5"/>
						</svg>
						Вернуться назад
					</Button>

					<Button
						onClick={() => navigate('/TrainingManagement')}
						className="flex items-center gap-2"
						style={{ backgroundColor: '#E57035' }}
					>
						<Home className="h-5 w-5" />
						На главную
					</Button>
				</div>

				{/* Дополнительная информация */}
				<div className="mt-12 pt-6 border-t" style={{ borderColor: 'rgba(39, 92, 115, 0.2)' }}>
					<p className="text-sm" style={{ color: '#275C73' }}>
						Если проблема повторяется, свяжитесь с нашей поддержкой
					</p>
					<Button
						variant="link"
						className="text-sm p-0 h-auto"
						style={{ color: '#E57035' }}
					>
						support@ddxtraining.com
					</Button>
				</div>
			</motion.div>
		</div>
	)
}

