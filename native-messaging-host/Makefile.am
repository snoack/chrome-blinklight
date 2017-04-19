binary = native-messaging-host
manifest = org.snoack.blinklight.json

CFLAGS = -O2 -Wall -Wextra -Werror
EXTRA_DIST = $(manifest).in

pkglibexec_PROGRAMS = $(binary)
native_messaging_host_SOURCES = native-messaging-host.c
native_messaging_host_CPPFLAGS = $(JSONC_CFLAGS)
if STATIC_JSONC
native_messaging_host_LDADD = $(JSONC_LIBDIR)/libjson-c.a
else
native_messaging_host_LDFLAGS = $(JSONC_LIBS)
endif

manifest_chromedir = /etc/opt/chrome/native-messaging-hosts
manifest_chrome_DATA = $(manifest)
manifest_chromiumdir = /etc/chromium/native-messaging-hosts
manifest_chromium_DATA = $(manifest)

$(manifest):
	sed -e 's|@path[@]|$(pkglibexecdir)/$(binary)|g' $(manifest).in > $(manifest)

install: install-am
	if [ -z "$(nosetcap)" ]; then setcap cap_dac_override,cap_sys_module+ep $(pkglibexecdir)/$(binary); fi

clean: clean-am
	rm -f $(manifest)
