# Revenuers

**Revenuers** is a personal revenue dashboard for aggregating income from multiple app stores, advertising platforms, and creator platforms into a single view.

The project is currently under active development.

## Goal

Instead of checking multiple dashboards separately, Revenuers will collect and normalize revenue data from services such as:

- Apple App Store
- Amazon Appstore
- Google Play
- Google AdMob
- Patreon
- itch.io

The long-term goal is to provide a unified view of revenue by **app, platform, date, country, and revenue type**.

## Planned Integrations

| Platform | Type | Status |
| --- | --- | --- |
| Apple App Store | App sales / IAP / subscriptions | Planned |
| Amazon Appstore | App sales / IAP | Planned |
| Google Play | App sales / IAP / subscriptions | Planned |
| Google AdMob | Advertising | Planned |
| Patreon | Memberships | Future |
| itch.io | Game sales | Future |

## Tech Stack

- **Node.js**
- **TypeScript**
- **NestJS**
- **TypeORM**
- **MySQL 8.4**
- **Docker Compose** for local MySQL

## Architecture

Each external platform will have its own integration layer and will normalize its data into a common revenue model.

```text
Apple App Store ───┐
Amazon Appstore ───┤
Google Play ───────┤
AdMob ─────────────┼──► Normalized Revenue ──► MySQL ──► Dashboard
Patreon ───────────┤
itch.io ───────────┘
```

This allows the dashboard to calculate revenue independently of the original platform.

## Revenue Model

Revenue records currently support the following sources:

```text
APPLE
AMAZON
GOOGLE_PLAY
ADMOB
PATREON
ITCH
```

Revenue types:

```text
APP_SALE
IAP
SUBSCRIPTION
AD
DONATION
OTHER
```

## Project Structure

```text
src/
├── app.module.ts
├── main.ts
└── revenue/
    ├── entities/
    │   └── revenue-record.entity.ts
    ├── revenue.controller.ts
    ├── revenue.module.ts
    └── revenue.service.ts
```

## Local Development

### Requirements

- Node.js
- npm
- Docker
- Docker Compose

### Install Dependencies

```bash
npm install
```

### Environment

Create a `.env` file:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=revenuers
DB_PASSWORD=your-password
DB_DATABASE=revenuers
```

Do not commit `.env` to Git.

### Start MySQL

```bash
docker compose up -d
```

Check the container:

```bash
docker ps
```

### Start Revenuers

```bash
npm run start:dev
```

The application will be available at:

```text
http://localhost:3000
```

The current revenue endpoint is:

```text
GET /revenue
```

For a new database this currently returns:

```json
[]
```

## Current Status

The initial backend foundation is working:

- NestJS application
- MySQL database
- Docker-based local database
- TypeORM integration
- Revenue module
- Revenue entity
- Revenue service
- Revenue API endpoint

## Roadmap

- [ ] Add application model
- [ ] Associate revenue records with applications
- [ ] Add Apple App Store Connect integration
- [ ] Add Amazon Appstore integration
- [ ] Build initial revenue dashboard
- [ ] Add scheduled report imports
- [ ] Add Google Play integration
- [ ] Add AdMob integration
- [ ] Add revenue breakdown by application
- [ ] Add revenue breakdown by platform
- [ ] Add date-range reporting
- [ ] Add currency normalization
- [ ] Add Patreon integration
- [ ] Add itch.io integration

## License

This project is currently provided for personal and experimental use.
