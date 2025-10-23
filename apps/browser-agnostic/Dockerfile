FROM mcr.microsoft.com/playwright:v1.56.1-jammy 

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build browser-agnostic

EXPOSE 3005
CMD ["node", "dist/apps/browser-agnostic/main"]
