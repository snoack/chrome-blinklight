#include <string>
#include <vector>
#include <iostream>
#include <fstream>
#include <algorithm>

#include <string.h>
#include <dirent.h>
#include <unistd.h>

#include "led_control.h"

unsigned int Led::brightness() {
	std::ifstream f;
	unsigned int brightness;

	f.open(brightness_file.c_str());
	f >> brightness;
	f.close();

	return brightness;
}

void Led::set_brightness(unsigned int brightness) {
	std::ofstream f;

	f.open(brightness_file.c_str());
	f << brightness;
	f.close();
}

std::string Led::trigger() {
	return CheckTriggers().active;
}

void Led::set_trigger(std::string trigger) {
	// if the given trigger is alredy active, don't set it again.
	// Otherwise for example if the "timer" trigger is already active,
	// the LED will stop blinking for a short moment.
	if (trigger.compare(CheckTriggers().active) == 0)
		return;

	std::ofstream f;

	f.open(trigger_file.c_str());
	f << trigger;
	f.close();

	// when changing the trigger, we have to give the kernel some time
	// to apply the change internally. Otherwise setting a positive
	// brightness might lead to keeping the previous trigger.
	usleep(10000);
}

std::vector<std::string> Led::available_triggers() {
	return CheckTriggers().available;
}

bool Led::can_control() {
	return !access(brightness_file.c_str(), R_OK | W_OK) && !access(trigger_file.c_str(), R_OK | W_OK);
}

Led::TriggerResult Led::CheckTriggers() {
	std::ifstream f;
	Led::TriggerResult result;

	f.open(trigger_file.c_str());
	while (!f.eof()) {
		char buffer[100];
		char *s = buffer;

		f.getline(buffer, sizeof buffer, ' ');

		if (s[0] == '[') {
			size_t end = strlen(s) - 1;

			if (s[end] == ']') {
				(s++)[end] = '\0';
				result.active = s;
			}
		}

		result.available.push_back(s);
	}

	f.close();
	result.available.pop_back();
	return result;
}

Led* LedControl::GetLed(std::string led) {
	if (led.find('/') == std::string::npos)
	if (led.compare(""  ) != 0)
	if (led.compare("." ) != 0)
	if (led.compare("..") != 0)
	if (!access(("/sys/class/leds/" + led).c_str(), F_OK))
		return new Led(led);

	return NULL;
}

bool led_comp(Led *a, Led *b) {
	return a->led().compare(b->led()) < 0;
}

std::vector<Led*> LedControl::GetAllLeds() {
	std::vector<Led*> leds;
	DIR *dir = opendir("/sys/class/leds");
	struct dirent *dirent;

	while (dirent = readdir(dir))
		if (strcmp(dirent->d_name, "." ) != 0)
		if (strcmp(dirent->d_name, "..") != 0)
			leds.push_back(new Led(dirent->d_name));

	closedir(dir);
	std::sort(leds.begin(), leds.end(), led_comp);
	return leds;
}
