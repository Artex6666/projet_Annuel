#!/bin/bash

# Trouver le PID du process npm run serve
PID=$(ps aux | grep 'npm run serve' | grep -v grep | awk '{print $2}')

if [ ! -z "$PID" ]; then
  echo "Arrêt du process existant (PID: $PID)"
  kill -9 $PID
fi

# Lancer l'application en arrière-plan avec nohup
nohup npm run serve &
echo "Application (re)démarrée avec nohup." 