import re
import os
import time
import platform
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import serial
import serial.tools.list_ports
import threading

import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variable for Arduino connection
arduino = None

def find_arduino_port():
    """Find available Arduino port automatically"""
    ports = serial.tools.list_ports.comports()
    arduino_keywords = ['arduino', 'ch340', 'ch341', 'cp210', 'ftdi', 'usb']
    
    print("Available serial ports:")
    for port in ports:
        print(f"  {port.device}: {port.description}")
    
    # First, try the port from environment variable
    env_port = os.getenv("BOARD_ID")
    if env_port:
        try:
            test_serial = serial.Serial(env_port, 9600, timeout=1)
            test_serial.close()
            print(f"Using environment port: {env_port}")
            return env_port
        except (serial.SerialException, PermissionError) as e:
            print(f"Environment port {env_port} failed: {e}")
    
    # Then try to find Arduino automatically
    for port in ports:
        port_desc = port.description.lower()
        if any(keyword in port_desc for keyword in arduino_keywords):
            try:
                test_serial = serial.Serial(port.device, 9600, timeout=1)
                test_serial.close()
                print(f"Found Arduino on: {port.device}")
                return port.device
            except (serial.SerialException, PermissionError) as e:
                print(f"Port {port.device} failed: {e}")
                continue
    
    return None

def initialize_arduino():
    """Initialize Arduino connection with error handling"""
    global arduino
    
    # Find the Arduino port
    port = find_arduino_port()
    if not port:
        print("No Arduino found or all ports failed. Running without Arduino connection.")
        return False
    
    try:
        arduino = serial.Serial(port, 9600, timeout=1)
        time.sleep(2)  # Wait for connection to establish
        print(f"Successfully connected to Arduino on {port}")
        return True
    except (serial.SerialException, PermissionError) as e:
        print(f"Failed to connect to Arduino on {port}: {e}")
        if platform.system() == "Windows":
            print("Windows troubleshooting tips:")
            print("1. Make sure no other applications are using the COM port")
            print("2. Try running as Administrator")
            print("3. Check Device Manager for COM port conflicts")
            print("4. Disconnect and reconnect the Arduino")
        arduino = None
        return False


def send_to_arduino(text_to_send):
    """Send text to Arduino via serial connection"""
    global arduino
    
    if arduino is None or not arduino.is_open:
        print("Arduino not connected. Attempting to reconnect...")
        if not initialize_arduino():
            return "Arduino not available"
    
    try:
        # Send text to Arduino
        arduino.write(text_to_send.encode())
        print(f"Sent to Arduino: {text_to_send}")
        
        # Optional: Read response from Arduino
        if arduino.in_waiting > 0:
            response = arduino.readline().decode().strip()
            print(f"Arduino response: {response}")
            return response
        return None
    except Exception as e:
        print(f"Error sending to Arduino: {e}")
        arduino = None  # Reset connection on error
        return f"Error: {str(e)}"


@socketio.on('send_to_arduino')
def handle_arduino_message(data):
    """Handle incoming messages from clients to send to Arduino"""
    try:
        text = data.get('text', '')
        if text:
            response = send_to_arduino(text)
            # Send confirmation back to client
            emit('arduino_response', {
                'status': 'success',
                'sent_text': text,
                'arduino_response': response
            })
        else:
            emit('arduino_response', {
                'status': 'error',
                'message': 'No text provided'
            })
    except Exception as e:
        emit('arduino_response', {
            'status': 'error',
            'message': str(e)
        })


@socketio.on('reconnect_arduino')
def handle_arduino_reconnect():
    """Handle Arduino reconnection request from client"""
    try:
        success = initialize_arduino()
        if success:
            emit('arduino_reconnect_response', {
                'status': 'success',
                'message': 'Arduino reconnected successfully'
            })
        else:
            emit('arduino_reconnect_response', {
                'status': 'error',
                'message': 'Failed to reconnect to Arduino'
            })
    except Exception as e:
        emit('arduino_reconnect_response', {
            'status': 'error',
            'message': str(e)
        })


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    status_message = 'Connected to Arduino controller' if arduino and arduino.is_open else 'Arduino not connected'
    emit('status', {'message': status_message})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


@app.route("/")
def main():
    return render_template("welcome.html")


if __name__ == "__main__":
    try:
        # Initialize Arduino connection
        print("Initializing Arduino connection...")
        arduino_connected = initialize_arduino()
        
        if not arduino_connected:
            print("WARNING: Starting Flask app without Arduino connection")
        
        # Start the Flask app with WebSocket support
        socketio.run(app, host="0.0.0.0", port=5550, debug=True)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        if arduino and arduino.is_open:
            arduino.close()
            print("Arduino connection closed")
