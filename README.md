# entgo.kz

Платформа персональной подготовки к ЕНТ: диагностический тест, серверный разбор
ответов, недельный план, короткие учебные сессии, статистика, рейтинг и кабинет.

## Локальный запуск

```bash
copy .env.example .env
npm install
npm run infra:start
npm run db:generate
npm run db:push
npm run dev
```

Приложение откроется на `http://127.0.0.1:3000`.

`infra:start` запускает локальные PostgreSQL-совместимую PGlite и Redis-службу
без Docker. В production используются управляемые PostgreSQL и Redis.

## Основные маршруты

- `/` — маркетинговый лендинг;
- `/onboarding` → `/register` → `/verify-email` → `/exam` → `/results` — первый пробник;
- `/tests` — каталог пробников и тематической практики;
- `/universities`, `/universities/[slug]` — прогноз поступления и гранта;
- `/rewards/130` — заявка на программу подарков за официальный результат 130+;
- `/dashboard` — главная кабинета;
- `/plan`, `/study/[id]` — недельный план и Pomodoro;
- `/topics`, `/topics/[id]` — библиотека и теория;
- `/statistics`, `/leaderboard`, `/achievements` — прогресс и мотивация;
- `/settings` — профиль, цель, напоминания и пароль;
- `/premium` — Premium 4 990 ₸/месяц и пакет «До ЕНТ» 19 990 ₸;
- `/forgot-password`, `/reset-password`, `/phone-login` — восстановление и вход;
- `/admin` — кабинет сотрудников с ролевым доступом;
- `/privacy`, `/terms` — правовые страницы;
- `/api/health`, `/api/ready` — эксплуатационные проверки.

Google OAuth включается через `AUTH_GOOGLE_ID` и `AUTH_GOOGLE_SECRET`. AI работает
через Qwen в Alibaba Cloud Model Studio (`DASHSCOPE_API_KEY`, `QWEN_MODEL`,
`QWEN_BASE_URL`). SMS, email и платёжный провайдер подключаются переменными из
`.env.example`. Состояние интеграций без раскрытия секретов видно в `/admin`.

## Проверки

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:load
npm audit --audit-level=high
```

Playwright проверяет desktop и mobile Chromium. Нагрузочный smoke-тест по
умолчанию использует 50 одновременных клиентов в течение 10 секунд.

## Проверка мобильной версии и PWA

1. Запустите `npm run dev`.
2. Откройте Chrome DevTools и включите `Toggle Device Toolbar`.
3. Проверьте iPhone SE (320 px), iPhone 12/13/14 (390 px), Pixel 7 и Samsung Galaxy S20 (360–430 px).
4. Проверьте установку через пункт браузера «Добавить на главный экран».
5. Для проверки на реальном телефоне запустите:

```bash
npm run dev -- --host 0.0.0.0
```

Затем откройте `http://LOCAL_IP:3000` в той же локальной сети. Проверьте
пробник, AI-sidebar, поддержку, статистику, рейтинг и нижнюю навигацию.

## Production

```bash
docker build -t entgo-web .
npm run db:deploy
npm run admin:promote -- admin@example.com
```

Инструкции запуска находятся в `docs/DEPLOYMENT.md`, релизные ограничения — в
`docs/PRODUCT_STATUS.md`, обязательная проверка перед публикацией — в
`docs/RELEASE_CHECKLIST.md`.
