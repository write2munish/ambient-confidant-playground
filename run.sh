#!/bin/bash
# Startup script for macOS / Linux

# Clear console
clear

echo "=========================================================="
echo "    THE AMBIENT CONFIDANT PLAYGROUND - STARTUP SCRIPT"
echo "=========================================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not found. Please install Python to run the server."
    echo "Or, launch Ollama with CORS settings in terminal and double-click index.html:"
    echo "  OLLAMA_ORIGINS=\"*\" ollama serve"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "🟢 Starting local HTTP server on http://localhost:8000 ..."
echo "👉 Open http://localhost:8000 in your browser to run the playground."
echo "💡 Ensure Ollama is running and you have run: ollama pull gemma3:1b"
echo "=========================================================="
echo "Press Ctrl+C in this terminal to stop the server."
echo ""

# Run Python server
python3 -m http.server 8000
