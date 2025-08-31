import re
import os
import time
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
try:
    arduino = serial.Serial(port=os.getenv("BOARD_ID"), baudrate=9600, timeout=1)
    time.sleep(2)  # Wait for connection to establish
    print(f"Arduino connected on port: {os.getenv('BOARD_ID')}")
except Exception as e:
    print(f"Failed to connect to Arduino: {e}")
    print("The application will continue without Arduino connection.")


def send_to_arduino(text_to_send):
    """Send text to Arduino via serial connection"""
    if not arduino or not arduino.is_open:
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


@app.route("/")
def main():
    return render_template("welcome.html")


if __name__ == "__main__":
    try:
        # Start the Flask app with WebSocket support
        socketio.run(app, host="0.0.0.0", port=5550, debug=True)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        if arduino and arduino.is_open:
            arduino.close()
            print("Arduino connection closed")
