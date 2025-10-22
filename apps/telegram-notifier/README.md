# Telegram Notifier Microservice

This microservice sends notifications about domain warnings to a Telegram group.

## Features

- Listens for domain warnings from Kafka
- Sends formatted notifications to a configured Telegram group
- Provides health check endpoint

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for the "BotFather" (@BotFather)
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to create a new bot
4. Once created, BotFather will provide you with a token (API key) for your bot
5. Save this token for the next steps

### 2. Add the Bot to a Group

1. Create a new Telegram group or use an existing one
2. Add your bot to the group by searching for its username and adding it
3. Make sure to give the bot admin privileges so it can send messages

### 3. Get the Chat ID

1. Send a message in the group
2. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in your browser (replace `<YOUR_BOT_TOKEN>` with your actual bot token)
3. Look for the `"chat":{"id":` field in the response - this is your group chat ID
4. Save this chat ID for the next steps

### 4. Configure Environment Variables

Add the following environment variables to your `.env` file or directly in the docker-compose.yml:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## Running the Service

### Using Docker Compose

```bash
docker-compose up telegram-notifier
```

### Running Locally for Development

```bash
# Install dependencies
npm install

# Start the service
npm run start:dev -- --path apps/telegram-notifier
```

## Testing

You can test the Telegram notification functionality using the provided test script:

```bash
# Make sure Kafka is running
node test-telegram-bot.js
```

This will send a test domain warning message to Kafka, which will be picked up by the telegram-notifier service and sent to your Telegram group.

## API

### Health Check

- **Endpoint**: GET `/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "telegram-notifier",
    "timestamp": "2025-10-22T17:17:00.000Z"
  }
  ```

## Kafka Topics

### Consumed Topics

- **domain-warnings**: Listens for domain warning messages with the following structure:
  ```json
  {
    "domainId": 12345,
    "domainName": "example.com",
    "hasWarning": true,
    "browserType": "webkit",
    "timestamp": "2025-10-22T17:17:00.000Z"
  }
