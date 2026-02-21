#!/usr/bin/env python3
"""
RAG Stack Startup Automation
Starts Ollama in WSL, pulls embeddings model, and launches RAG server + sync watcher
"""

import subprocess
import time
import sys
import os
from pathlib import Path

# ANSI colors for terminal output
class Color:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Color.BLUE):
    """Print colored log message"""
    print(f"{color}{Color.BOLD}[RAG Stack]{Color.RESET} {message}")

def check_wsl():
    """Check if WSL is available"""
    try:
        subprocess.run(["wsl", "--status"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_ollama_ready(max_retries=10, delay=2):
    """Check if Ollama server is responding"""
    log("Waiting for Ollama to be ready...", Color.YELLOW)
    for i in range(max_retries):
        try:
            result = subprocess.run(
                ["wsl", "-e", "bash", "-c", "curl -s http://localhost:11434/api/tags"],
                capture_output=True,
                timeout=5
            )
            if result.returncode == 0:
                log("✓ Ollama is ready!", Color.GREEN)
                return True
        except subprocess.TimeoutExpired:
            pass
        
        if i < max_retries - 1:
            print(f"  Retry {i+1}/{max_retries}...", end='\r')
            time.sleep(delay)
    
    return False

def start_ollama():
    """Start Ollama server in WSL (background)"""
    log("Starting Ollama server in WSL...", Color.BLUE)
    try:
        # Start Ollama in background using wsl
        subprocess.Popen(
            ["wsl", "-e", "bash", "-c", "OLLAMA_HOST=0.0.0.0:11434 ollama serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0
        )
        time.sleep(3)  # Give it time to start
        
        if check_ollama_ready():
            return True
        else:
            log("✗ Ollama failed to start", Color.RED)
            return False
    except Exception as e:
        log(f"✗ Error starting Ollama: {e}", Color.RED)
        return False

def pull_embedding_model():
    """Pull nomic-embed-text model (blocking)"""
    log("Pulling nomic-embed-text model...", Color.BLUE)
    try:
        result = subprocess.run(
            ["wsl", "-e", "bash", "-c", "ollama pull nomic-embed-text"],
            check=True
        )
        if result.returncode == 0:
            log("✓ Model pulled successfully!", Color.GREEN)
            return True
        return False
    except subprocess.CalledProcessError as e:
        log(f"✗ Failed to pull model: {e}", Color.RED)
        return False

def start_rag_server(rag_path):
    """Start npm run serve in rag directory (background)"""
    log("Starting RAG server...", Color.BLUE)
    try:
        process = subprocess.Popen(
            ["npm", "run", "serve"],
            cwd=rag_path,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        time.sleep(2)
        log("✓ RAG server started in new terminal", Color.GREEN)
        return process
    except Exception as e:
        log(f"✗ Error starting RAG server: {e}", Color.RED)
        return None

def start_sync_watcher(rag_path):
    """Start npm run sync:watch in rag directory (background)"""
    log("Starting sync watcher...", Color.BLUE)
    try:
        process = subprocess.Popen(
            ["npm", "run", "sync:watch"],
            cwd=rag_path,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        time.sleep(1)
        log("✓ Sync watcher started in new terminal", Color.GREEN)
        return process
    except Exception as e:
        log(f"✗ Error starting sync watcher: {e}", Color.RED)
        return None

def main():
    """Main execution flow"""
    print(f"\n{Color.BOLD}{'='*60}{Color.RESET}")
    print(f"{Color.BOLD}{Color.BLUE}   🧠 RAG Stack Startup Automation{Color.RESET}")
    print(f"{Color.BOLD}{'='*60}{Color.RESET}\n")
    
    # Step 0: Check WSL
    if not check_wsl():
        log("✗ WSL is not available. Please install WSL first.", Color.RED)
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Step 1: Start Ollama
    if not start_ollama():
        log("✗ Failed to start Ollama. Exiting.", Color.RED)
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Step 2: Pull embedding model
    if not pull_embedding_model():
        log("⚠ Model pull failed, but continuing...", Color.YELLOW)
    
    # Step 3: Determine rag path
    script_dir = Path(__file__).parent.parent
    rag_path = script_dir / "rag"
    
    if not rag_path.exists():
        log(f"✗ RAG directory not found: {rag_path}", Color.RED)
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Step 4: Start RAG server
    server_process = start_rag_server(str(rag_path))
    
    # Step 5: Start sync watcher
    sync_process = start_sync_watcher(str(rag_path))
    
    # Summary
    print(f"\n{Color.BOLD}{'='*60}{Color.RESET}")
    log("✓ All services started!", Color.GREEN)
    print(f"{Color.BOLD}{'='*60}{Color.RESET}\n")
    
    print(f"{Color.YELLOW}Services running:{Color.RESET}")
    print(f"  • Ollama Server (WSL): http://localhost:11434")
    print(f"  • RAG Server: http://localhost:6444")
    print(f"  • Sync Watcher: Active")
    
    print(f"\n{Color.YELLOW}Note:{Color.RESET} Close the spawned terminal windows to stop services.")
    print(f"{Color.YELLOW}Tip:{Color.RESET} You can now query the RAG server or use Windsurf.\n")
    
    input("Press Enter to exit this launcher...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("\n✗ Interrupted by user", Color.YELLOW)
        sys.exit(0)
    except Exception as e:
        log(f"\n✗ Unexpected error: {e}", Color.RED)
        input("\nPress Enter to exit...")
        sys.exit(1)
