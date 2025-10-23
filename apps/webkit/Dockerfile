FROM node:24-slim

RUN apt-get update && apt-get install -y \
  libglib2.0-0 \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxcb1 \
  libxkbcommon0 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libatspi2.0-0 \
  libwayland-client0 \
  gstreamer1.0-plugins-base \
  flite \
  flite1-dev \
  libwebp-dev \
  libavif-dev \
  libharfbuzz-dev \
  libharfbuzz-icu0 \
  libepoxy-dev \
  libjpeg-dev \
  libenchant-2-dev \
  libsecret-1-dev \
  libhyphen-dev \
  libwayland-dev \
  libmanette-0.2-dev \
  libpsl-dev \
  libnghttp2-dev \
  libgles2-mesa-dev \
  libx264-dev \
  libgtk-4-1 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libgdk-pixbuf2.0-0 \
  libcairo2 \
  libgraphene-1.0-0 \
  libatomic1 \
  libxslt1.1 \
  liblcms2-2 \
  libwoff1 \
  libvpx7 \
  libevent-2.1-7 \
  libgstreamer-gl1.0-0 \
  libgstreamer-plugins-bad1.0-0

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build webkit

RUN npx playwright install

CMD ["node", "dist/apps/webkit/main"]
