FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for API URL
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Development command
CMD ["npm", "run", "dev"]

