FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod -R 777 uploads

EXPOSE 3000

CMD ["npm", "start"]
