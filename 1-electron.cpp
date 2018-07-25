#include "Particle.h"

// Test Program #4 for Firebase Integration
// Similar to #2, but optimized for the Electron. Goes to sleep between samples.
// Just generates some simple random data once a minute, stores in a per-device table
// using the device name as the key.
STARTUP(System.enableFeature(FEATURE_RETAINED_MEMORY));

#include <math.h> // This is just for cos and M_PI, used in generating random sample data

SYSTEM_THREAD(ENABLED);

// Forward declarations
void publishData();
void deviceNameHandler(const char *topic, const char *data);

const unsigned long POST_CONNECT_WAIT_MS = 8000;
const unsigned long NAME_WAIT_MS = 20000;
const unsigned long POST_PUBLISH_WAIT_MS = 2000;
const unsigned long MAX_CONNECT_TIME_MS = 120000;
const unsigned long SLEEP_TIME_SEC = 3600;
const char *PUBLISH_EVENT_NAME = "test2data";

const uint32_t RETAINED_DATA_MAGIC = 0xa2c7206a;
const size_t DEVICE_NAME_MAX_LEN = 31;
typedef struct {
	uint32_t magic;
	char deviceName[DEVICE_NAME_MAX_LEN + 1];
} RetainedData;

enum State {
	START_STATE,
	CONNECTED_WAIT_STATE,
	POST_CONNECT_WAIT_STATE,
	GET_NAME_STATE,
	NAME_WAIT_STATE,
	PUBLISH_STATE,
	POST_PUBLISH_WAIT_STATE,
	SLEEP_STATE
};

retained RetainedData retainedData = {0};

int nextValue = 1;
State state = START_STATE;
unsigned long stateTime = 0;

void setup() {
	Serial.begin(9600);

}

void loop() {
	switch(state) {
	case START_STATE:
		state = CONNECTED_WAIT_STATE;
		stateTime = millis();
		break;

	case CONNECTED_WAIT_STATE:
		if (Particle.connected()) {
			Serial.println("connected to the cloud");
			state = POST_CONNECT_WAIT_STATE;
		}
		else
		if (millis() - stateTime >= MAX_CONNECT_TIME_MS) {
			// Failed to connect to the cloud, go to sleep and try again later
			Serial.println("failed to connect to cloud");
			state = SLEEP_STATE;
		}
		break;

	case POST_CONNECT_WAIT_STATE:
		if (millis() - stateTime >= POST_CONNECT_WAIT_MS) {
			state = GET_NAME_STATE;
		}
		break;

	case GET_NAME_STATE:
		if (retainedData.magic != RETAINED_DATA_MAGIC || retainedData.deviceName[0] == 0) {
			memset(&retainedData, 0, sizeof(retainedData));
			retainedData.magic = RETAINED_DATA_MAGIC;

			Particle.subscribe("spark/", deviceNameHandler);
			Particle.publish("spark/device/name");
			state = NAME_WAIT_STATE;
			stateTime = millis();
		}
		else {
			Serial.printlnf("device name in retained memory %s", retainedData.deviceName);
			state = PUBLISH_STATE;
			stateTime = millis();
		}
		break;

	case NAME_WAIT_STATE:
		if (retainedData.deviceName[0] != 0) {
			Serial.printlnf("device name from cloud %s", retainedData.deviceName);
			state = PUBLISH_STATE;
			stateTime = millis();
		}
		else
		if (millis() - stateTime >= NAME_WAIT_MS) {
			// Failed to connect to the cloud, go to sleep and try again later
			Serial.println("failed to get device name");
			state = SLEEP_STATE;
		}
		break;


	case PUBLISH_STATE:
		publishData();

		state = POST_PUBLISH_WAIT_STATE;
		stateTime = millis();
		break;

	case POST_PUBLISH_WAIT_STATE:
		if (millis() - stateTime >= POST_PUBLISH_WAIT_MS) {
			state = SLEEP_STATE;
		}
		break;

	case SLEEP_STATE:
		Serial.printlnf("going to sleep for %d seconds", SLEEP_TIME_SEC);

		// This delay is just so you can see the serial print go out, feel free to remove if desired
		delay(250);

		System.sleep(SLEEP_MODE_DEEP, SLEEP_TIME_SEC);

		// Not reached; when waking up from SLEEP_MODE_DEEP, the code starts again from setup()
		break;

	}
}

void publishData() {
	// This just publishes some somewhat random data for testing

	// a is a monotonically increasing integer
	int a = nextValue++;

	// double value b is a cosine, so the values will rise and fall nicely over 360 steps
	double b = cos((double)(a % 360) * M_PI / 180.0);

	// c is a random integer
	int c = rand();

	char buf[256];
	snprintf(buf, sizeof(buf), "{\"a\":%d,\"b\":%.3f,\"c\":%d,\"n\":\"%s\"}", a, b, c, retainedData.deviceName);
	Serial.printlnf("publishing %s", buf);
	Particle.publish(PUBLISH_EVENT_NAME, buf, PRIVATE);
}

void deviceNameHandler(const char *topic, const char *data) {
	if (strlen(data) <= DEVICE_NAME_MAX_LEN) {
		strcpy(retainedData.deviceName, data);
	}
	else {
		// Truncate name
		strncpy(retainedData.deviceName, data, DEVICE_NAME_MAX_LEN);
		retainedData.deviceName[DEVICE_NAME_MAX_LEN] = 0;
	}
}
