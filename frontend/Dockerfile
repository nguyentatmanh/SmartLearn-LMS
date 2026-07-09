FROM node:18-alpine

WORKDIR /workspace

# Copy dependencies manifest
COPY package.json ./

# Install dependencies
RUN npm install

# Copy frontend source files
COPY . .

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
