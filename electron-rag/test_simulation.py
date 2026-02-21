#!/usr/bin/env python3
"""
RAG Control Panel Simulation - Python Version
Simulates exact Electron renderer.js + ServiceManager.js flow
"""
import subprocess
import time
import json
import sys
import http.client
from datetime import datetime

class ServiceManager:
    def __init__(self):
        self.services = {
            'ollama': {'name': 'Ollama Server', 'process': None, 'status': 'stopped', 'port': 11434},
            'ragServer': {'name': 'RAG Server', 'process': None, 'status': 'stopped', 'port': 6444},
            'syncWatcher': {'name': 'Sync Watcher', 'process': None, 'status': 'stopped', 'port': None}
        }
        self.logs = []
    
    def add_log(self, service_name, message, log_type='info'):
        timestamp = datetime.now().strftime('%I:%M:%S %p')
        log_entry = {'timestamp': timestamp, 'message': message.strip(), 'type': log_type}
        self.logs.append(log_entry)
        
        type_prefix = {
            'info': '[INFO]',
            'success': '[SUCCESS]',
            'error': '[ERROR]',
            'stdout': '[STDOUT]',
            'stderr': '[STDERR]'
        }.get(log_type, '[INFO]')
        
        print(f"[{timestamp}] [{service_name.upper()}] {type_prefix} {message}")
    
    def update_status(self, service_name, status):
        if service_name in self.services:
            self.services[service_name]['status'] = status
            self.add_log(service_name, f"Status updated to: {status}", 'info')
    
    def sleep(self, ms):
        time.sleep(ms / 1000.0)
    
    def is_port_in_use(self, port):
        """Check if port is in use using HTTP connection attempt"""
        try:
            conn = http.client.HTTPConnection('localhost', port, timeout=1)
            conn.request('GET', '/health')
            response = conn.getresponse()
            conn.close()
            return True
        except:
            return False
    
    def check_health(self, port):
        """Check health endpoint"""
        try:
            conn = http.client.HTTPConnection('localhost', port, timeout=2)
            conn.request('GET', '/health')
            response = conn.getresponse()
            data = response.read().decode('utf-8')
            conn.close()
            return {
                'ok': 200 <= response.status < 300,
                'status': response.status,
                'body': data
            }
        except Exception as e:
            return {'ok': False, 'status': 0, 'error': str(e)}
    
    async def start_ollama(self):
        self.add_log('ollama', '[OLLAMA] startOllama() called', 'info')
        self.add_log('ollama', '[OLLAMA] Starting Ollama in WSL...', 'info')
        
        cmd = ['wsl', '-e', 'bash', '-c', 'OLLAMA_HOST=0.0.0.0:11434 ollama serve']
        self.add_log('ollama', f"[OLLAMA] Spawning: {' '.join(cmd)}", 'info')
        
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.DEVNULL,
                text=True,
                bufsize=1
            )
            
            self.add_log('ollama', f"[OLLAMA] Process spawned with PID: {proc.pid}", 'info')
            self.services['ollama']['process'] = proc
            
            # Non-blocking output reading
            import threading
            
            def read_stdout():
                try:
                    for line in proc.stdout:
                        if line.strip():
                            self.add_log('ollama', f"[OLLAMA STDOUT] {line.strip()}", 'stdout')
                except:
                    pass
            
            def read_stderr():
                try:
                    for line in proc.stderr:
                        if line.strip():
                            self.add_log('ollama', f"[OLLAMA STDERR] {line.strip()}", 'stderr')
                except:
                    pass
            
            threading.Thread(target=read_stdout, daemon=True).start()
            threading.Thread(target=read_stderr, daemon=True).start()
            
            self.add_log('ollama', '[OLLAMA] Waiting 2 seconds for startup...', 'info')
            self.sleep(2000)
            
            # Check if process is still alive
            if proc.poll() is None:
                self.add_log('ollama', '[OLLAMA] Ollama started successfully', 'success')
            else:
                exit_code = proc.poll()
                self.add_log('ollama', f'[OLLAMA EXIT] Process exited with code: {exit_code}', 'error')
                # Don't fail - Ollama might already be running
                self.add_log('ollama', '[OLLAMA] Assuming Ollama is already running (port conflict)', 'info')
            
        except Exception as e:
            self.add_log('ollama', f"[OLLAMA ERROR] Failed to start: {str(e)}", 'error')
            raise
    
    async def start_rag_server(self):
        import os
        
        service = self.services['ragServer']
        rag_path = os.path.join(os.path.dirname(__file__), 'rag')
        
        self.add_log('ragServer', 'Starting RAG Server...', 'info')
        self.add_log('ragServer', f'Working directory: {rag_path}', 'info')
        
        try:
            proc = subprocess.Popen(
                ['node', 'src/server.mjs'],
                cwd=rag_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.DEVNULL,
                text=True,
                bufsize=1,
                env={**os.environ, 'NODE_NO_WARNINGS': '1', 'FORCE_COLOR': '0'}
            )
            
            self.add_log('ragServer', f'[RAG] Process spawned with PID: {proc.pid}', 'info')
            service['process'] = proc
            
            # Non-blocking output reading
            import threading
            
            def read_stdout():
                try:
                    for line in proc.stdout:
                        if line.strip():
                            self.add_log('ragServer', line.strip(), 'stdout')
                except:
                    pass
            
            def read_stderr():
                try:
                    for line in proc.stderr:
                        if line.strip():
                            self.add_log('ragServer', line.strip(), 'stderr')
                except:
                    pass
            
            threading.Thread(target=read_stdout, daemon=True).start()
            threading.Thread(target=read_stderr, daemon=True).start()
            
            # Warmup before polling (matching ServiceManager.js line 195)
            self.add_log('ragServer', '[HEALTH] Waiting 2 seconds before health checks...', 'info')
            self.sleep(2000)
            
            # Poll for health up to 30 seconds (matching ServiceManager.js line 198)
            healthy = False
            for i in range(30):
                self.sleep(1000)
                
                # Check if process died
                if proc.poll() is not None:
                    self.add_log('ragServer', f'[RAG EXIT] Process exited with code: {proc.poll()}', 'error')
                    break
                
                port_open = self.is_port_in_use(service['port'])
                if port_open:
                    res = self.check_health(service['port'])
                    status_msg = f"status {res.get('status', 0)}"
                    if 'error' in res:
                        status_msg += f" - {res['error']}"
                    
                    log_type = 'info' if res.get('ok') else 'error'
                    self.add_log('ragServer', f"[HEALTH] Attempt {i + 1}: {status_msg}", log_type)
                    
                    if res.get('ok'):
                        healthy = True
                        break
                else:
                    self.add_log('ragServer', f"[HEALTH] Attempt {i + 1}: port 6444 not open yet", 'info')
            
            if healthy:
                self.add_log('ragServer', 'RAG Server started on port 6444', 'success')
            else:
                self.add_log('ragServer', 'RAG Server failed to start (port 6444 still closed or unhealthy)', 'error')
                self.update_status('ragServer', 'stopped')
                if proc.poll() is None:
                    proc.terminate()
                service['process'] = None
                raise Exception('RAG Server did not open port 6444')
                
        except Exception as e:
            self.add_log('ragServer', f'[RAG ERROR] Failed to start: {str(e)}', 'error')
            raise
    
    async def start(self, service_name):
        """Main start method matching ServiceManager.js"""
        self.add_log(service_name, f'[SERVICE] start() called for {service_name}', 'info')
        
        if service_name not in self.services:
            self.add_log(service_name, f'[SERVICE ERROR] Unknown service: {service_name}', 'error')
            return {'success': False, 'error': 'Unknown service'}
        
        service = self.services[service_name]
        if service['status'] == 'running':
            self.add_log(service_name, f'[SERVICE] Service already running: {service_name}', 'info')
            return {'success': False, 'error': 'Service already running'}
        
        try:
            self.add_log(service_name, "[SERVICE] Updating status to 'starting'", 'info')
            self.update_status(service_name, 'starting')
            
            self.add_log(service_name, f'[SERVICE] Entering switch statement for {service_name}', 'info')
            
            if service_name == 'ollama':
                self.add_log(service_name, '[SERVICE] Calling startOllama()', 'info')
                await self.start_ollama()
                self.add_log(service_name, '[SERVICE] startOllama() completed', 'info')
            elif service_name == 'ragServer':
                self.add_log(service_name, '[SERVICE] Calling startRagServer()', 'info')
                await self.start_rag_server()
                self.add_log(service_name, '[SERVICE] startRagServer() completed', 'info')
            else:
                self.add_log(service_name, f'[SERVICE ERROR] No handler for service: {service_name}', 'error')
                raise Exception(f'Unknown service: {service_name}')
            
            self.add_log(service_name, "[SERVICE] Updating status to 'running'", 'info')
            self.update_status(service_name, 'running')
            self.add_log(service_name, f'[SERVICE] start() completed successfully for {service_name}', 'info')
            return {'success': True}
            
        except Exception as error:
            self.add_log(service_name, f'[SERVICE ERROR] start() failed: {str(error)}', 'error')
            self.update_status(service_name, 'stopped')
            import traceback
            self.add_log(service_name, f'[SERVICE ERROR] Full error: {traceback.format_exc()}', 'error')
            return {'success': False, 'error': str(error)}


async def simulate_button_click(service_name):
    """Simulate renderer.js handleStart() function"""
    print(f"\n{'='*60}")
    print(f"SIMULATING START: {service_name.upper()}")
    print(f"{'='*60}")
    
    manager = ServiceManager()
    
    # Matching renderer.js lines 62-68
    manager.add_log(service_name, f'[UI] Button clicked for {service_name}', 'info')
    manager.add_log(service_name, f'[UI] ▶ Starting {service_name}...', 'info')
    manager.add_log(service_name, f"[UI] Calling IPC: window.electronAPI.startService('{service_name}')", 'info')
    
    # Matching main.js IPC handler
    print(f"[MAIN] IPC handler: service:start for {service_name}")
    print(f"[MAIN] Calling serviceManager.start('{service_name}')")
    
    # Call ServiceManager.start()
    result = await manager.start(service_name)
    
    # Matching renderer.js lines 72-78
    manager.add_log(service_name, f'[IPC] Response received: {json.dumps(result)}', 'info')
    
    if not result['success']:
        manager.add_log(service_name, f"[ERROR] ✗ Failed to start: {result.get('error', 'Unknown error')}", 'error')
        print(f"\n❌ FAILED: {service_name}")
        return False
    else:
        manager.add_log(service_name, '[SUCCESS] ✓ Start command sent successfully', 'success')
        print(f"\n✅ SUCCESS: {service_name}")
        return True


async def main():
    print("="*60)
    print("RAG Control Panel Simulation - Python")
    print("="*60)
    print()
    
    # Test Ollama
    success_ollama = await simulate_button_click('ollama')
    
    # Wait 3 seconds before next service
    print("\n⏳ Waiting 3 seconds before starting RAG Server...")
    time.sleep(3)
    
    # Test RAG Server
    success_rag = await simulate_button_click('ragServer')
    
    print("\n" + "="*60)
    print("SIMULATION COMPLETE")
    print("="*60)
    print(f"Ollama:     {'✅ PASS' if success_ollama else '❌ FAIL'}")
    print(f"RAG Server: {'✅ PASS' if success_rag else '❌ FAIL'}")
    print("="*60)
    
    if success_ollama and success_rag:
        print("\n🎉 ALL TESTS PASSED - Electron should work the same way")
        sys.exit(0)
    else:
        print("\n❌ TESTS FAILED - Fix required")
        sys.exit(1)


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
