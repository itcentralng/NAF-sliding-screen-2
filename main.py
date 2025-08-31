import re
import os
import time
import platform
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import serial

import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure the serial connection
arduino = None

def init_arduino():
    """Initialize Arduino connection with Windows-specific handling"""
    global arduino
    if arduino and arduino.is_open:
        return arduino
    
    try:
        port = os.getenv("BOARD_ID")
        if not port:
            print("No BOARD_ID specified in environment")
            return None
            
        # Windows-specific serial port configuration
        if platform.system() == "Windows":
            arduino = serial.Serial(
                port=port,
                baudrate=9600,
                timeout=1,
                write_timeout=1,
                exclusive=True  # Prevent other processes from accessing the port
            )
        else:
            arduino = serial.Serial(port=port, baudrate=9600, timeout=1)
            
        time.sleep(2)  # Wait for connection to establish
        print(f"Arduino connected on port: {port}")
        return arduino
    except Exception as e:
        print(f"Failed to connect to Arduino: {e}")
        print("The application will continue without Arduino connection.")
        return None

# Initialize Arduino connection
arduino = init_arduino()


def send_to_arduino(text_to_send):
    """Send text to Arduino via serial connection"""
    global arduino
    
    # Check if connection is still valid, reinitialize if needed
    if not arduino or not arduino.is_open:
        print("Arduino connection lost, attempting to reconnect...")
        arduino = init_arduino()
        if not arduino:
            print("Arduino not connected")
            return "Arduino not connected"
    
    try:
        # Send text to Arduino
        arduino.write(text_to_send.encode())
        print(f"Sent to Arduino: {text_to_send}")
        
        # Optional: Read response from Arduino (with timeout)
        start_time = time.time()
        while time.time() - start_time < 1.0:  # 1 second timeout
            if arduino.in_waiting > 0:
                response = arduino.readline().decode().strip()
                print(f"Arduino response: {response}")
                return response
            time.sleep(0.01)
        return None
    except Exception as e:
        print(f"Error sending to Arduino: {e}")
        # Try to reinitialize connection on error
        arduino = init_arduino()
        return None


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


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    # Check Arduino connection status
    arduino_status = "connected" if arduino and arduino.is_open else "disconnected"
    emit('status', {
        'message': 'Connected to Arduino controller',
        'arduino_status': arduino_status
    })


@socketio.on('check_arduino_status')
def handle_status_check():
    """Check Arduino connection status"""
    global arduino
    try:
        if arduino and arduino.is_open:
            # Try to check if the connection is still active
            emit('arduino_status', {
                'status': 'connected',
                'port': os.getenv("BOARD_ID")
            })
        else:
            # Try to reconnect
            arduino = init_arduino()
            status = "connected" if arduino and arduino.is_open else "disconnected"
            emit('arduino_status', {
                'status': status,
                'port': os.getenv("BOARD_ID")
            })
    except Exception as e:
        emit('arduino_status', {
            'status': 'error',
            'message': str(e)
        })


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


@app.route("/")
def main():
    return render_template("welcome.html")


if __name__ == "__main__":
    try:
        # Disable debug mode on Windows to prevent reloader interference with serial connection
        debug_mode = platform.system() != "Windows"
        print(f"Starting server with debug mode: {debug_mode}")
        
        # Start the Flask app with WebSocket support
        socketio.run(app, host="0.0.0.0", port=5550, debug=debug_mode)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        if arduino and arduino.is_open:
            try:
                arduino.close()
                print("Arduino connection closed")
            except:
                pass
