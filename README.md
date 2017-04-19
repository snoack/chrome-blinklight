chrome-blinklight
=================

This is an extension for Google Chrome that makes an LED of your laptop
running Linux, blink while...

### Gmail
* you have unread emails in your inbox
* you got a message via Hangouts
* you got a message via Google Talk

### Google Plus
* you have unread notifications
* you got a message via Hangouts

### IRCCloud
* your nick was mentionen in a chat
* you got a private message

### Pinned tabs
* the title has changed (similar to the built-in behavior in Chrome of flashing pinned tabs)

Installation
------------

chrome-blinklight consists of two parts, a Chrome extension that observes
tabs for the above events, and a native host application that controls the LED.
In order for chrome-blinklight to work, both have to be installed.

### On Debian/Ubuntu

A Debian package is available from the author's PPA. If you are running Debian
or Ubuntu, just run following commands as *root* (or with `sudo`):

```
add-apt-repository ppa:s.noack/ppa
sed -i "s/$(lsb_release -cs)/zesty/g" /etc/apt/sources.list.d/s_noack-ppa-*.list
apt-get update
apt-get install chrome-blinklight
```

The next time you start Chromium, the extension should be active, and the
settings, where you have to set the LED and trigger, should pop up. If Chromium
is already running, restart it now. However, if you are using Google Chrome,
you have to install the extension seperately from the [Chrome Web Store][1].

### Building from source

In order to build the host application, you need a C compiler, *autotools*
and the *json-c* development files. Given you have all of these installed,
and you are in the project root now, run following commands:

```
cd native-messaging-host
autoreconf --install
./configure
make
```

Then, install the host application, by running following command as *root*:

```
make install
```

Finally, install the extension from the [Chrome Web Store][1], if not done yet.
During development, you can also load the extension directly from the
`extension` subdirectory in the source tree, this however, is not recommended
for normal usage.

[1]: https://chrome.google.com/webstore/detail/blinklight/jiaipmkogklkpmpabagihfledlejmgaf
