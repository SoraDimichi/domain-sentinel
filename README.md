# Domain Sentinel

A distributed system for monitoring domains for security warnings across multiple browsers.

## Overview

Domain Sentinel is a microservice-based application designed to detect security warnings, phishing attempts, and malicious content across websites. It uses multiple browser engines to check domains and sends notifications when security issues are detected.

## Key Features

- **Multi-Browser Support**: Tests domains across Chrome and WebKit browsers
- **Distributed Processing**: Uses Kafka for message distribution and processing
- **Automated Scheduling**: Periodically checks domains based on configurable schedules
- **Real-time Notifications**: Sends alerts via Telegram when security warnings are detected
- **Scalable Architecture**: Microservices design allows for horizontal scaling

## Architecture

The system consists of several microservices:

- **Scheduler**: Manages domain checking schedules and distributes batches of domains
- **Browser Agnostic Services**: Process domains using Playwright with Chrome and WebKit
- **Telegram Notifier**: Sends notifications when security warnings are detected

```mermaid
graph TB
    %% External Systems
    API[External API]:::external
    User[User/Admin]:::external

    %% Data Storage
    MongoDB[(MongoDB)]:::storage

    %% Message Broker
    Kafka[Apache Kafka]:::broker

    %% Scheduler Service
    Scheduler[Scheduler Service]:::scheduler

    %% Browser Services
    ChromeService[Browser Chrome]:::browser
    WebKitService[Browser WebKit]:::browser

    %% Notification Service
    TelegramNotifier[Telegram Notifier]:::notification

    %% Connections between components
    API --- Scheduler
    Scheduler --- MongoDB
    Scheduler --- Kafka
    Kafka --- ChromeService
    Kafka --- WebKitService
    ChromeService --- MongoDB
    WebKitService --- MongoDB
    ChromeService --- Kafka
    WebKitService --- Kafka
    Kafka --- TelegramNotifier
    TelegramNotifier --- User
```

## Technology Stack

- **Backend**: NestJS (TypeScript)
- **Browser Automation**: Playwright
- **Message Broker**: Apache Kafka
- **Database**: MongoDB
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 16+ (for local development)

### Running the Application

1. Clone the repository
2. Start the services:

```bash
docker-compose up -d
```

3. Monitor the services:

```bash
docker-compose logs -f
```

### Configuration

The application is configured through environment variables in the docker-compose.yml file:

- **Kafka Configuration**: Broker addresses, topics, etc.
- **MongoDB Connection**: Database URI
- **Browser Settings**: Browser types and configurations
- **Telegram Notifications**: Bot token and chat ID

## Secrets Configuration Guide

### Telegram Notifier Secrets

The Telegram notifier service requires the following environment variables:

- **TELEGRAM_BOT_TOKEN**: Your Telegram bot token obtained from BotFather
  - Required for the Telegram notifier service to authenticate with the Telegram API
  - Example: `5555555555:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
  - How to obtain:
    1. Message [@BotFather](https://t.me/BotFather) on Telegram
    2. Create a new bot using the `/newbot` command
    3. Copy the token provided by BotFather

- **TELEGRAM_CHAT_ID**: The chat ID where notifications will be sent
  - Can be a group chat ID or individual user ID
  - Example: `-1003192364231`
  - How to obtain:
    1. Add your bot to the desired group or start a private chat with it
    2. Send a message in the chat
    3. Access `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
    4. Find the `chat` object and copy the `id` value

### Scheduler Service Secrets

The scheduler service requires the following environment variables:

- **API_KEY**: Authentication key for the external API
  - Required for the scheduler to authenticate with the domain API
  - Example: `your-api-key-here`

- **API_ENDPOINT**: URL of the external API for domain synchronization
  - Default: `https://hor.info/admin_api/v1/domains`
  - Example: `https://your-domain-api.example.com/v1/domains`

## Development

### Building and Testing

```bash
# Install dependencies
npm install

# Build all applications
npm run build

```
