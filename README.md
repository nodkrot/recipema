![logo](./logo.png)

Family recipes hub.

## Setup

Create `.env` with the following variables (this project uses Firebase):

```
VITE_FB_API_KEY=
VITE_FB_AUTH_DOMAIN=
VITE_FB_DATABASE_URL=
VITE_FB_PROJECT_ID=
VITE_FB_STORAGE_BUCKET=
VITE_FB_MESSAGEING_SENDER_ID=
```

## Development

Use these commands for development:

```
npm install                     # This will install npm dependencies
npm start                       # This will start the app on port 1234
npm run format                  # This will format code with prettier
npm run deploy                  # This will build and deploy the app
npm run analyze                 # This will generate bundle size report
```

## Deployment

Note: For production deployments create `.env.production`

Use these commands for deployment:

```
npm run deploy                  # This will build and deploy the app
```

## Telegram bot

[@recipemabot](https://t.me/recipemabot) searches the recipe collection from Telegram. It runs as a
Cloud Function (`functions/`) in the same Firebase project and reads the same `recipes` collection.

```
Telegram ──webhook──▶ Cloud Function (recipeBot) ──▶ Gemini API
                              │
                              ▼
                     Firestore `recipes`
```

- Write normally ("что приготовить из фарша?") → Gemini finds matching recipes and answers questions
- Send a recipe as text, a forward, or a photo of a cookbook page → preview → "Сохранить" adds it
  (a dish photo goes into the gallery); reply to a preview to correct it before saving
- Reply to a recipe card with a photo → adds it to that recipe's gallery
- Reply to a recipe card (or send its portal link) with a change ("разбей приготовление на шаги")
  → preview → "Сохранить" writes it; the old values go to `recipes/{id}/history` and "Вернуть как было" undoes it
- `/find <слово>` keyword search · `/list` all recipes · `/tags` by tag · `/random`

Configuration: `functions/.env` (`GEMINI_MODEL`, `PORTAL_URL`), the gitignored
`functions/.env.<project id>` for private settings (`ALLOWED_USER_IDS`, `AUTHOR_IDS`; see the
comments in `functions/.env`), and secrets in Secret Manager (`TELEGRAM_BOT_TOKEN`,
`TELEGRAM_WEBHOOK_SECRET`, `GEMINI_API_KEY`), set with `firebase functions:secrets:set <NAME>`. Unknown users get a reply with their Telegram ID
to add to `ALLOWED_USER_IDS`.

```
firebase deploy --only functions   # builds and deploys the bot
firebase functions:log             # logs
```

The webhook was registered once with:

```
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://us-central1-recipema-87dbb.cloudfunctions.net/recipeBot" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message","callback_query"]'
```

Optional, to auto-delete de-duplication records and unconfirmed drafts:
`gcloud firestore fields ttls update expireAt --collection-group=processedUpdates --enable-ttl`
`gcloud firestore fields ttls update expireAt --collection-group=botDrafts --enable-ttl`
