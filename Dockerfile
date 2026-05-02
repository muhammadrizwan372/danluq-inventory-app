FROM python:3.12-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Build frontend
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend to backend static
RUN mkdir -p backend/static && cp -r frontend/dist/* backend/static/

# Set working directory to backend
WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
