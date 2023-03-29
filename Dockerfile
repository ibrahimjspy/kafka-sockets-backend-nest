FROM node:16-alpine

WORKDIR /app

# Installing dependencies 
ADD package*.json ./
RUN npm config set registry http://registry.npmjs.org
RUN npm install

# Copy all code
COPY . .

# Checking linting
RUN npm run lint

# Build package
RUN npm run prebuild
RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start"]
