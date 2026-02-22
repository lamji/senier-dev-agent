#!/usr/bin/env python3
"""
Akrizu Stack Startup Automation
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
    print(f"{color}{Color.BOLD}[Akrizu Stack]{Color.RESET} {message}")

def check_wsl():
    """Check if WSL is available"""
    try:
        subprocess.run(["wsl", "--status"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_ollama_ready(max_retries=10, delay=2, silent=False):
    """Check if Ollama server is responding"""
    if not silent:
        log("Waiting for Ollama to be ready...", Color.YELLOW)
    for i in range(max_retries):
        try:
            # Try to connect to the tags endpoint
            result = subprocess.run(
                ["wsl", "-e", "bash", "-c", "curl -s -f http://127.0.0.1:11434/api/tags"],
                capture_output=True,
                timeout=5
            )
            if result.returncode == 0:
                if not silent:
                    log("✓ Ollama is ready!", Color.GREEN)
                return True
        except (subprocess.TimeoutExpired, Exception):
            pass
        
        if i < max_retries - 1:
            if not silent:
                print(f"  Retry {i+1}/{max_retries}...", end='\r')
            time.sleep(delay)
    
    return False

def start_ollama():
    """Start Ollama server in WSL (background)"""
    # First, check if it's already running
    if check_ollama_ready(max_retries=1, delay=0, silent=True):
        log("✓ Ollama is already running.", Color.GREEN)
        return True

    log("Starting Ollama server in WSL...", Color.BLUE)
    try:
        # Start Ollama in background using wsl
        # We use CREATE_NEW_PROCESS_GROUP to ensure it lives independently of this script's console
        subprocess.Popen(
            ["wsl", "-e", "bash", "-c", "OLLAMA_HOST=0.0.0.0:11434 ollama serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0
        )
        
        # Give it a moment to initialize
        time.sleep(3)
        
        if check_ollama_ready(max_retries=10, delay=2):
            log("Settle delay (2s)...", Color.YELLOW)
            time.sleep(2)
            return True
        else:
            log("✗ Ollama failed to start. Check WSL with 'ollama serve' manually.", Color.RED)
            return False
    except Exception as e:
        log(f"✗ Error starting Ollama: {e}", Color.RED)
        return False

def pull_embedding_model():
    """Pull nomic-embed-text model (blocking)"""
    log("Checking/Pulling nomic-embed-text model...", Color.BLUE)
    try:
        # Check if model already exists to avoid unnecessary pull time
        list_result = subprocess.run(
            ["wsl", "-e", "bash", "-c", "ollama list"],
            capture_output=True,
            text=True
        )
        if "nomic-embed-text" in list_result.stdout:
            log("✓ Model 'nomic-embed-text' already present.", Color.GREEN)
            return True

        # Otherwise pull it
        log("Model not found. Pulling now (this may take a minute)...", Color.YELLOW)
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
    log("Starting Akrizu Knowledge server...", Color.BLUE)
    try:
        npm_cmd = "npm.cmd" if sys.platform == 'win32' else "npm"
        process = subprocess.Popen(
            [npm_cmd, "run", "serve"],
            cwd=rag_path,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        time.sleep(2)
        log("✓ Akrizu server started in new terminal", Color.GREEN)
        return process
    except Exception as e:
        log(f"✗ Error starting Akrizu server: {e}", Color.RED)
        return None

def start_sync_watcher(rag_path):
    """Start npm run sync:watch in rag directory (background)"""
    log("Starting sync watcher...", Color.BLUE)
    try:
        npm_cmd = "npm.cmd" if sys.platform == 'win32' else "npm"
        process = subprocess.Popen(
            [npm_cmd, "run", "sync:watch"],
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
    print(f"{Color.BOLD}{Color.BLUE}   🧠 Akrizu Engine Startup Automation{Color.RESET}")
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
        log("✗ Failed to pull nomic-embed-text model. Exiting.", Color.RED)
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Step 3: Determine paths
    script_dir = Path(__file__).parent.parent
    akrizu_path = script_dir / "akrizu-knowledge"
    
    if not akrizu_path.exists():
        log(f"✗ Akrizu directory not found: {akrizu_path}", Color.RED)
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Step 4: Start Akrizu Knowledge server
    server_process = start_rag_server(str(akrizu_path))
    
    # Step 5: Start sync watcher
    sync_process = start_sync_watcher(str(akrizu_path))
    
    # Summary
    print(f"\n{Color.BOLD}{'='*60}{Color.RESET}")
    log("✓ All services started!", Color.GREEN)
    print(f"{Color.BOLD}{'='*60}{Color.RESET}\n")
    
    print(f"{Color.YELLOW}Services running:{Color.RESET}")
    print(f"  • Ollama Server (WSL): http://localhost:11434")
    print(f"  • Akrizu Dashboard:     http://localhost:6444")
    print(f"  • Sync Watcher:         Active")
    
    print(f"\n{Color.YELLOW}Note:{Color.RESET} Close the spawned terminal windows to stop services.")
    print(f"{Color.YELLOW}Tip:{Color.RESET} Use the dashboard to update settings.\n")
    
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
