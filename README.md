# Telegram-бот для Bishkek Gigs

Бот работает 24/7 и принимает от исполнителей адрес + реквизиты после выполнения задания.

## Как создать бота (5 минут)

1. Открой Telegram → найди **@BotFather**
2. Напиши `/newbot`
3. Придумай имя (например `Bishkek Gigs Bot`)
4. Придумай username (должен заканчиваться на `bot`, например `BishkekGigsBot`)
5. BotFather даст тебе **токен** вида `123456:ABC-DEF...` — сохрани его

## Как узнать свой chat_id

1. Запусти бота (или временно поставь любой токен)
2. Напиши боту команду `/myid`
3. Он ответит твоим числом — это и есть `ADMIN_CHAT_ID`

## Как запустить бота 24/7 бесплатно

### Вариант 1 — Railway (рекомендую)

1. Зайди на https://railway.app и войди через GitHub
2. New Project → Deploy from GitHub repo (или Upload)
3. Добавь переменные окружения:
   - `BOT_TOKEN` = твой токен от BotFather
   - `ADMIN_CHAT_ID` = твоё число chat_id
4. Railway сам поставит зависимости из `requirements.txt` и запустит

### Вариант 2 — Render.com

1. https://render.com → New → Web Service
2. Подключи репозиторий или загрузи код
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python bot.py`
5. Добавь Environment Variables (BOT_TOKEN и ADMIN_CHAT_ID)
6. Важно: на бесплатном плане сервис засыпает через 15 мин бездействия. Для бота лучше Railway или платный план.

### Вариант 3 — Локально (для теста)

```bash
pip install -r requirements.txt
export BOT_TOKEN="твой_токен"
export ADMIN_CHAT_ID="твой_chat_id"
python bot.py
```

## Что делает бот

- Когда пользователь на сайте нажимает «Открыть бота» после загрузки фото — открывается deep-link `t.me/твойбот?start=task_UUID`
- Бот сразу понимает, по какому заданию пишут
- Просит отправить адрес + реквизиты одним сообщением
- Пересылает тебе всё красиво оформленным сообщением
- Отвечает пользователю «Данные отправлены, жди оплату»

## Обнови сайт

В файле `js/config.js` поставь:

```js
const BOT_TELEGRAM = 'BishkekGigsBot';  // username бота без @
```
