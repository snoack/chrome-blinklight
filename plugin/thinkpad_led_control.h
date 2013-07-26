#ifndef HELLOWORLD_H
#define HELLOWORLD_H

#include <string>

class ThinkpadLedControl {
	public:
		ThinkpadLedControl() {}
		void ControlLed(int led, std::string command);
};

#endif  // HELLOWORLD_H
