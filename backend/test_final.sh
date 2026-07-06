#!/bin/bash
lsof -i :3001 -t | xargs kill -9 || true
lsof -i :3005 -t | xargs kill -9 || true
lsof -i :3006 -t | xargs kill -9 || true
nohup node /home/team/shared/nichepulse/backend/index.js > /home/team/shared/nichepulse/backend/backend_final.log 2>&1 &
sleep 5
curl -i "http://localhost:3001/api/download-data?email=final-test@example.com"
