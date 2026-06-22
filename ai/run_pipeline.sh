#!/bin/bash
# NichePulse Intelligence Pipeline Runner
# This script runs the pipeline in a loop every 4 hours.

PIPELINE_SCRIPT="/home/team/shared/nichepulse/ai/pipeline.py"
INTERVAL=14400 # 4 hours in seconds

echo "NichePulse Pipeline Daemon Started."
echo "Running every $INTERVAL seconds."

while true; do
    echo "[$(date)] Starting pipeline run..."
    python3 "$PIPELINE_SCRIPT"
    echo "[$(date)] Pipeline run finished. Sleeping for $INTERVAL seconds..."
    sleep "$INTERVAL"
done
