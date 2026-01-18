import socket
import sys

def check_port(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(('127.0.0.1', port))
        print(f"Port {port} is FREE")
        s.close()
    except Exception as e:
        print(f"Port {port} is BUSY: {e}")

if __name__ == "__main__":
    check_port(8001)
