# 1. Use a lightweight Python base image
FROM python:3.9-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the dependency file first (for caching speed)
COPY requirements.txt .

# 4. Install dependencies
# We add "no-cache-dir" to keep the image small
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install Pillow uvicorn

# 5. Copy the rest of your backend code
COPY . .

# 6. Expose the port the app runs on
EXPOSE 8000

# 7. Command to run the application
# host 0.0.0.0 is crucial for Docker containers to talk to the outside world
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]