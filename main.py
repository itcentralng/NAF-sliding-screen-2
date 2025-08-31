import os
import threading
import time
from flask import Flask
from flask_socketio import SocketIO, emit
import serial

import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure the serial connection
arduino = serial.Serial(port=os.getenv("BOARD_ID"), baudrate=9600, timeout=1)
time.sleep(5)  # Wait for connection to establish


def send_to_arduino(text_to_send):
    """Send text to Arduino via serial connection"""
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
    emit('status', {'message': 'Connected to Arduino controller'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


if __name__ == "__main__":
    serial_thread = threading.Thread(target=send_to_arduino)
    serial_thread.daemon = True
    serial_thread.start()
    # Start the Flask app with WebSocket support
    socketio.run(app, host="0.0.0.0", port=5550)