#include <string>
#include <iostream>
#include <fstream>
#include "thinkpad_led_control.h"

void ThinkpadLedControl::ControlLed(int led, std::string command) {
	std::ofstream f;

	f.open("/proc/acpi/ibm/led");
	f << led;
	f << " ";
	f << command;
	f.close();
}
