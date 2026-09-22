"""
Bishkek Gigs Telegram Bot
-------------------------
Бот работает 24/7 и принимает от исполнителей:
- адрес получателя
- реквизиты для оплаты

После получения данных — пересылает всё тебе (админу).
"""

import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ================== НАСТРОЙКИ ==================
# Эти переменные лучше задавать через Environment Variables на хостинге
BOT_TOKEN = os.getenv("BOT_TOKEN", "ВСТАВЬ_СЮДА_ТОКЕН_ОТ_BOTFATHER")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "0"))  # твой chat_id (число)

# Простая память: кто сейчас в процессе отправки данных по заданию
# user_id -> task_id
waiting_for_details = {}

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка /start и deep-link /start task_UUID"""
    user = update.effective_user
    args = context.args

    if args and args[0].startswith("task_"):
        task_id = args[0].replace("task_", "")
        waiting_for_details[user.id] = task_id

        text = (
            f"Привет, {user.first_name}! 👋\n\n"
            f"Ты выполнил задание.\n\n"
            f"Теперь отправь мне **одним сообщением**:\n"
            f"1. Полный адрес получателя\n"
            f"2. Реквизиты для оплаты (номер карты / телефон МБанк / О! / Элсом и т.д.)\n"
            f"3. Любые комментарии (если нужно)\n\n"
            f"Пример:\n"
            f"Адрес: ул. Киевская 123, кв. 45\n"
            f"Карта: 4169 1234 5678 9012\n"
            f"Коммент: позвонить за 10 минут"
        )
        await update.message.reply_text(text, parse_mode="Markdown")
    else:
        text = (
            f"Привет, {user.first_name}! 👋\n\n"
            f"Это бот платформы **Bishkek Gigs**.\n\n"
            f"Если ты выполнил задание — нажми кнопку «Открыть бота» на сайте после загрузки фото.\n"
            f"Тогда я пойму, по какому заданию ты пишешь."
        )
        await update.message.reply_text(text, parse_mode="Markdown")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Любое текстовое сообщение"""
    user = update.effective_user
    text = update.message.text

    # Если админ написал /myid — покажем его chat_id
    if text.strip().lower() in ["/myid", "myid", "/id"]:
        await update.message.reply_text(
            f"Твой chat_id: `{user.id}`\n\n"
            f"Скопируй это число и вставь в ADMIN_CHAT_ID в настройках бота.",
            parse_mode="Markdown"
        )
        return

    # Если пользователь в режиме ожидания деталей
    if user.id in waiting_for_details:
        task_id = waiting_for_details.pop(user.id)

        # Сообщение админу
        admin_text = (
            f"💰 **Новая заявка на оплату!**\n\n"
            f"От: {user.full_name} (@{user.username or 'нет юзернейма'})\n"
            f"User ID: `{user.id}`\n"
            f"Task ID: `{task_id}`\n\n"
            f"Данные от исполнителя:\n"
            f"{text}"
        )

        try:
            if ADMIN_CHAT_ID and ADMIN_CHAT_ID != 0:
                await context.bot.send_message(
                    chat_id=ADMIN_CHAT_ID,
                    text=admin_text,
                    parse_mode="Markdown"
                )
                await update.message.reply_text(
                    "✅ Спасибо! Данные отправлены администратору.\n"
                    "Ожидай оплату в ближайшее время."
                )
            else:
                await update.message.reply_text(
                    "⚠️ Бот ещё не настроен (нет ADMIN_CHAT_ID).\n"
                    "Напиши админу напрямую."
                )
        except Exception as e:
            logger.error(f"Failed to send to admin: {e}")
            await update.message.reply_text(
                "Произошла ошибка при отправке. Попробуй ещё раз позже или напиши админу."
            )
        return

    # Обычное сообщение
    await update.message.reply_text(
        "Я понимаю только сообщения после того, как ты нажал кнопку «Открыть бота» на сайте.\n"
        "Если ты выполнил задание — зайди на сайт, найди своё задание и нажми кнопку."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Как пользоваться:\n"
        "1. Выполни задание на сайте\n"
        "2. Загрузи фото\n"
        "3. Нажми кнопку «Открыть бота»\n"
        "4. Отправь адрес + реквизиты одним сообщением"
    )


def main():
    if not BOT_TOKEN or BOT_TOKEN.startswith("ВСТАВЬ"):
        print("❌ Ошибка: укажи BOT_TOKEN!")
        return

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🤖 Бот запущен и работает 24/7...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
