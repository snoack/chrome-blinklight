#ifndef LED_CONTROL_H
#define LED_CONTROL_H

#include <string>
#include <vector>

#include <string.h>
#include <stdlib.h>

class Led {
	public:
		Led(std::string led) :
			led_(led),
			brightness_file("/sys/class/leds/" + led + "/brightness"),
			trigger_file   ("/sys/class/leds/" + led + "/trigger"   ) {}

		std::string led() const { return led_; }

		unsigned int brightness();
		void set_brightness(unsigned int brightness);

		std::string trigger();
		void set_trigger(std::string trigger);

		std::vector<std::string> available_triggers();
		bool can_control();

	private:
		struct TriggerResult {
			std::vector<std::string> available;
			std::string active;
		};

		std::string led_;
		std::string brightness_file;
		std::string trigger_file;

		TriggerResult CheckTriggers();
};

class LedControl {
	public:
		LedControl() {}
		Led* GetLed(std::string led);
		std::vector<Led*> GetAllLeds();
};

#endif
