// Stepper Motor Control with TB6600 Driver and Array-based Positioning
// Commands: 'home', '1967-1977', '1977-1987', '1987-1997', '1997-2007', '2007-2017', '2017-2027'
// Motor moves to the position corresponding to the array index of the command

#define STEP_PIN 6
#define DIR_PIN 2

#define ENABLE_PIN 8
#define LIMIT_SWITCH_PIN 7  // Connect your limit switch to pin 7

// Motor parameters
int stepDelay = 2000; // microseconds between steps (adjust for speed)

// Position array and motor control variables
String positions[7] = {"home", "1967-1977", "1977-1987", "1987-1997", "1997-2007", "2007-2017", "2017-2027"};

// Position distances in steps from home position
const int positionSteps[7] = {
    0,     // home
    1333,  // 1967-1977: 1333 steps from home
    2833,  // 1977-1987: 1333 + 1500 = 2833 steps from home
    4333,  // 1987-1997: 2833 + 1500 = 4333 steps from home
    5833,  // 1997-2007: 4333 + 1500 = 5833 steps from home
    7333,  // 2007-2017: 5833 + 1500 = 7333 steps from home
    8833   // 2017-2027: 7333 + 1500 = 8833 steps from home
};

int currentPosition = -1; // Current motor position index (-1 means unknown)
bool isCalibrated = false; // Flag to track if motor has been calibrated to start position

void setup() {
    // Initialize serial communication
    Serial.begin(9600);
    
    // Initialize pins
    pinMode(STEP_PIN, OUTPUT);
    pinMode(DIR_PIN, OUTPUT);
    pinMode(ENABLE_PIN, OUTPUT);
    
    // Enable the motor driver
    digitalWrite(ENABLE_PIN, LOW);

    // Initialize limit switch pin
    pinMode(LIMIT_SWITCH_PIN, INPUT_PULLUP);

    Serial.println("Array-based Stepper Motor Controller Ready");
    Serial.println("Available positions: home, 1967-1977, 1977-1987, 1987-1997, 1997-2007, 2007-2017, 2017-2027");
    Serial.println("Calibrating to home position...");
    
    // Move to home position (index 0) on startup
    calibrateToHome();
}

void loop() {
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        
        parseAndExecuteCommand(command);
    }
}

void parseAndExecuteCommand(String command) {
    // Find the index of the command in the positions array
    int targetIndex = -1;
    for (int i = 0; i < 7; i++) {
        if (command.equals(positions[i])) {
            targetIndex = i;
            break;
        }
    }
    
    if (targetIndex == -1) {
        Serial.println("Invalid command. Available positions: home, 1967-1977, 1977-1987, 1987-1997, 1997-2007, 2007-2017, 2017-2027");
        return;
    }
    
    if (!isCalibrated) {
        Serial.println("Motor not calibrated. Calibrating to home position...");
        calibrateToHome();
    }
    
    moveToPosition(targetIndex);
}

void calibrateToHome() {
    Serial.println("Calibrating: Moving left to limit switch...");
    
    // Move left until limit switch is hit
    digitalWrite(DIR_PIN, LOW); // Left direction
    
    while (digitalRead(LIMIT_SWITCH_PIN) == HIGH) {
        digitalWrite(STEP_PIN, HIGH);
        delayMicroseconds(stepDelay);
        digitalWrite(STEP_PIN, LOW);
        delayMicroseconds(stepDelay);
    }
    
    Serial.println("Limit switch triggered! Moving 100 steps right to clear switch...");
    
    // Move 100 steps right to clear the limit switch
    digitalWrite(DIR_PIN, HIGH); // Right direction
    for (int i = 0; i < 100; i++) {
        digitalWrite(STEP_PIN, HIGH);
        delayMicroseconds(stepDelay);
        digitalWrite(STEP_PIN, LOW);
        delayMicroseconds(stepDelay);
    }
    
    currentPosition = 0; // Now at home position
    isCalibrated = true;
    Serial.println("Calibration complete. Motor is at 'home' position.");
}

void moveToPosition(int targetIndex) {
    if (targetIndex == currentPosition) {
        Serial.println("Already at position: " + positions[targetIndex]);
        return;
    }
    
    int currentSteps = positionSteps[currentPosition];
    int targetSteps = positionSteps[targetIndex];
    int stepsToMove = abs(targetSteps - currentSteps);
    bool moveRight = targetSteps > currentSteps;
    
    Serial.println("Moving from position '" + positions[currentPosition] + "' (index " + String(currentPosition) + 
                  ") to '" + positions[targetIndex] + "' (index " + String(targetIndex) + ")");
    Serial.println("Direction: " + String(moveRight ? "right" : "left") + ", Steps: " + String(stepsToMove));
    
    moveMotor(moveRight, stepsToMove);
    currentPosition = targetIndex;
    
    Serial.println("Movement complete. Now at position: " + positions[currentPosition]);
}

void moveMotor(bool clockwise, int steps) {
    // Set direction
    digitalWrite(DIR_PIN, clockwise ? HIGH : LOW);

    // Step the motor
    for (int i = 0; i < steps; i++) {
        // Check limit switch (active HIGH)
        if (digitalRead(LIMIT_SWITCH_PIN) == LOW) {
            Serial.println("Limit switch triggered! Stopping motor after " + String(i) + " steps.");
            
            // If we hit the limit switch, we're at position 0 (home)
            currentPosition = 0;
            
            // Move 100 steps in the opposite direction to clear the switch
            Serial.println("Moving 100 steps right to clear switch...");
            digitalWrite(DIR_PIN, HIGH); // Always move right when clearing limit switch
            for (int j = 0; j < 100; j++) {
                digitalWrite(STEP_PIN, HIGH);
                delayMicroseconds(stepDelay);
                digitalWrite(STEP_PIN, LOW);
                delayMicroseconds(stepDelay);
            }
            Serial.println("Limit switch cleared");
            break;
        }
        digitalWrite(STEP_PIN, HIGH);
        delayMicroseconds(stepDelay);
        digitalWrite(STEP_PIN, LOW);
        delayMicroseconds(stepDelay);
    }

    Serial.println("Motor movement complete");
}

