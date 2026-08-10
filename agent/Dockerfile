FROM python:3.12.11-slim
WORKDIR /app
COPY agent/requirements.txt /app/agent/requirements.txt
RUN pip install --no-cache-dir -r /app/agent/requirements.txt
COPY agent /app/agent
COPY data /app/data
ENV PYTHONUNBUFFERED=1 PORT=8000
EXPOSE 8000
CMD ["python", "-m", "agent.server"]
