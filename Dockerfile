FROM node:20.15.0-alpine

WORKDIR /app

COPY ./package.json .

RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "run", "dev"]

#docker build -t danvoron/fitness-manager:latest .
#docker push danvoron/fitness-manager:latest