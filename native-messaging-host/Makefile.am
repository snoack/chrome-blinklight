binary = native-messaging-host
manifest = org.snoack.blinklight.json

CFLAGS = -O2 -Wall -Wextra -Werror

pkglibexec_PROGRAMS = $(binary)
native_messaging_host_SOURCES = native-messaging-host.c
native_messaging_host_CPPFLAGS = $(JSONC_CFLAGS)
if STATIC_JSONC
native_messaging_host_LDADD = $(JSONC_LIBDIR)/libjson-c.a
else
native_messaging_host_LDFLAGS = $(JSONC_LIBS)
endif

manifest_chromedir = /etc/opt/chrome/native-messaging-hosts
manifest_chrome_DATA = chrome/$(manifest)
manifest_chromiumdir = /etc/chromium/native-messaging-hosts
manifest_chromium_DATA = chrome/$(manifest)
manifest_mozdir = /usr/lib/mozilla/native-messaging-hosts
manifest_moz_DATA = gecko/$(manifest)

chrome/$(manifest) gecko/$(manifest):
	@echo "Writing $@"
	@mkdir -p $(dir $@)
	@echo '{' > $@
	@echo '  "name": "org.snoack.blinklight",' >> $@
	@echo '  "description": "LED notification of urgent tabs",' >> $@
	@echo '  "path": "$(pkglibexecdir)/$(binary)",' >> $@
	@echo '  "type": "stdio",' >> $@
	@if [[ $@ = gecko/* ]]; \
		then echo '  "allowed_extensions": ["blinklight@snoack.addons.mozilla.org"]' >> $@; \
		else echo '  "allowed_origins": ["chrome-extension://jiaipmkogklkpmpabagihfledlejmgaf/"]' >> $@; \
	fi
	@echo '}' >> $@

install: install-am
	if [ -z "$(nosetcap)" ]; then setcap cap_dac_override,cap_sys_module+ep $(pkglibexecdir)/$(binary); fi

clean: clean-am
	rm chrome/$(manifest) 2>/dev/null && rmdir chrome || true
	rm gecko/$(manifest) 2>/dev/null && rmdir gecko || true
