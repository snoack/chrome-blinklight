#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>
#include <poll.h>
#include <signal.h>
#include <sys/file.h>
#include <sys/signalfd.h>
#include <sys/utsname.h>
#include <sys/syscall.h>
#include <json-c/json.h>

#define SYSFS_PATH "/sys/class/leds"

enum brightness {
  BRIGHTNESS_IGNORE = -2,
  BRIGHTNESS_UNSET = -1,
  BRIGHTNESS_FULL = 255
};

enum trigger_status {
  TRIGGER_UNKNOWN,
  TRIGGER_SUPPORTED,
  TRIGGER_ACTIVE
};

char *active_led = NULL;
char *old_trigger = NULL;
enum brightness old_brightness = BRIGHTNESS_UNSET;
int trigger_fd = -1;

#define attr_path(BUF, LED, ATTR) \
  (snprintf((BUF), sizeof(BUF), SYSFS_PATH "/%s/%s", (LED), (ATTR)), (BUF))

int get_attr(const char *attr)
{
  char path[100];
  FILE *fp = fopen(attr_path(path, active_led, attr), "r");
  int value = -1;

  if (fp != NULL) {
    fscanf(fp, "%d", &value);
    fclose(fp);
  }

  return value;
}

void set_attr(const char *attr, int value)
{
  char path[100];
  FILE* fp = fopen(attr_path(path, active_led, attr), "w");

  if (fp != NULL) {
    fprintf(fp, "%d", value);
    fclose(fp);
  }
}

enum trigger_status check_trigger(const char *expected)
{
  FILE *fp = fdopen(trigger_fd, "r");
  enum trigger_status status = TRIGGER_UNKNOWN;
  char buf[100];

  fseek(fp, 0, SEEK_SET);
  while ((status == TRIGGER_UNKNOWN || old_trigger == NULL) &&
         fscanf(fp, "%99s", buf) == 1) {
    if (buf[0] == '[') {
      int len = strlen(buf) - 2;

      strncpy(buf, buf + 1, len);
      buf[len] = 0;

      if (strcmp(buf, expected) == 0)
        status = TRIGGER_ACTIVE;

      if (old_trigger == NULL)
        old_trigger = strdup(buf);
    } else if (strcmp(buf, expected) == 0)
      status = TRIGGER_SUPPORTED;
  }

  return status;
}

void load_trigger_module(const char *trigger)
{
  struct utsname info;
  char path[100];
  int fd;

  uname(&info);
  snprintf(path, sizeof(path),
           "/lib/modules/%s/kernel/drivers/leds/trigger/ledtrig-%s.ko",
           info.release, trigger);

  fd = open(path, O_RDONLY);
  if (fd < 0)
    return;

  syscall(__NR_finit_module, fd, "", 0);
  close(fd);
}

void control_led(const char *trigger, enum brightness brightness)
{
  enum trigger_status trigger_status = check_trigger(trigger);

  // If the brightness is supposed to be overridden (indicated by a non-negative
  // value), and isn't overridden currently, backup the previous brightness.
  if (brightness >= 0 && old_brightness < 0)
    old_brightness = get_attr("brightness");

  // If the brightness is supposed to be set to the orignal value, and is
  // overridden currently, restore the previous brightness.
  if (brightness == BRIGHTNESS_UNSET && old_brightness >= 0) {
    brightness = old_brightness;
    old_brightness = BRIGHTNESS_UNSET;

    // If a brightness of 0 is supposed to be restored, set the brightness
    // before the trigger, otherwise the trigger will be reverted to "none".
    // However, we cannot set positive brightness values before setting the
    // trigger, because some triggers reset the brightness to 0.
    if (brightness == 0) {
      set_attr("brightness", brightness);
      brightness = BRIGHTNESS_IGNORE;
    }
  }

  if (trigger_status != TRIGGER_ACTIVE) {
    // If the brightness is neither going to be overridden nor to be restored from
    // a previous value, restore it to its current value after changing the trigger.
    if (brightness == BRIGHTNESS_UNSET)
      brightness = get_attr("brightness");

    // Don't set the brightness to 0 after changing the trigger, since this
    // would revert the trigger to "none".
    if (brightness == 0)
      brightness = BRIGHTNESS_IGNORE;

    if (trigger_status == TRIGGER_UNKNOWN)
      load_trigger_module(trigger);

    write(trigger_fd, trigger, strlen(trigger));

    // When setting the brightness to quickly after transitioning from/to
    // the "timer" trigger, the kernel gets stuck. While the sysfs indicates
    // the new trigger, the old trigger remains in effect.
    if (brightness >= 0)
      usleep(1000);
  }

  if (brightness > 0 && strcmp(trigger, "oneshot") == 0)
    set_attr("invert", 1);

  if (brightness >= 0)
    set_attr("brightness", brightness);
}

void handle_control_led(json_object *jobj_input)
{
  json_object *jobj_control;
  const char *control;

  if (active_led == NULL)
    return;
  if (!json_object_object_get_ex(jobj_input, "control", &jobj_control))
    return;

  control = json_object_get_string(jobj_control);
  if (strcmp(control, "on") == 0)
    control_led("none", BRIGHTNESS_FULL);
  else if (strcmp(control, "off") == 0)
    control_led("none", 0);
  else if (strcmp(control, "clear") == 0)
    control_led("none", BRIGHTNESS_UNSET);
  else if (strcmp(control, "timer") == 0)
    control_led("timer", BRIGHTNESS_UNSET);
  else if (strcmp(control, "oneshot") == 0) {
    control_led("oneshot", BRIGHTNESS_UNSET);
    set_attr("shot", 1);
  }
}

json_object *handle_set_led(json_object *jobj_input)
{
  json_object *jobj_led;
  const char *led;
  char path[100];
  int fd;

  if (old_trigger != NULL) {
    control_led(old_trigger, BRIGHTNESS_UNSET);
    free(old_trigger);
    old_trigger = NULL;
  }

  if (active_led != NULL) {
    free(active_led);
    active_led = NULL;
  }

  if (trigger_fd >= 0) {
    close(trigger_fd);
    trigger_fd = -1;
  }

  if (!json_object_object_get_ex(jobj_input, "led", &jobj_led) ||
      strchr(led = json_object_get_string(jobj_led), '/') != NULL ||
      (fd = open(attr_path(path, led, "trigger"), O_RDWR)) < 0)
    return json_object_new_string("unknown");

  if (flock(fd, LOCK_EX | LOCK_NB) < 0)
  {
    close(fd);
    return json_object_new_string("locked");
  }

  active_led = strdup(led);
  trigger_fd = fd;

  return NULL;
}

json_object* handle_get_leds()
{
  json_object *jobj = json_object_new_array();
  DIR *dir = opendir(SYSFS_PATH);
  struct dirent *entry;

  if (dir) {
    while ((entry = readdir(dir)) != NULL) {
      if (strcmp(entry->d_name, ".") != 0 && strcmp(entry->d_name, "..") != 0)
        json_object_array_add(jobj, json_object_new_string(entry->d_name));
    }
    closedir(dir);
  }

  return jobj;
}

int setup_sigfd()
{
  sigset_t sigset;

  sigemptyset(&sigset);
  sigaddset(&sigset, SIGTERM);
  sigaddset(&sigset, SIGINT);
  sigaddset(&sigset, SIGHUP);
  sigprocmask(SIG_BLOCK, &sigset, NULL);

  return signalfd(-1, &sigset, 0);
}

int main()
{
  json_tokener *tokener = json_tokener_new();
  char *input;
  unsigned int input_len;

  struct pollfd fds[] = {
    { .fd = STDIN_FILENO, .events = POLLIN },
    { .fd = setup_sigfd(), .events = POLLIN }
  };

  while (poll(fds, 2, -1) >= 0 && fds[1].revents == 0 &&
         read(STDIN_FILENO, &input_len, sizeof(input_len)) == sizeof(input_len) &&
         (input = malloc(input_len)) != NULL &&
         read(STDIN_FILENO, input, input_len) == input_len) {
    json_object *jobj_input;
    json_object *jobj_output = NULL;
    const char *output;
    unsigned int output_len;

    jobj_input = json_tokener_parse_ex(tokener, input, input_len);
    free(input);

    if (jobj_input) {
      json_object *jobj_action;

      if (json_object_object_get_ex(jobj_input, "action", &jobj_action)) {
        const char *action = json_object_get_string(jobj_action);

        if (strcmp(action, "control-led") == 0)
          handle_control_led(jobj_input);
        else if (strcmp(action, "set-led") == 0)
          jobj_output = handle_set_led(jobj_input);
        else if (strcmp(action, "get-leds") == 0)
          jobj_output = handle_get_leds();
      }

      json_object_put(jobj_input);
    }

    output = json_object_to_json_string(jobj_output);
    output_len = strlen(output);
    write(STDOUT_FILENO, &output_len, sizeof(output_len));
    write(STDOUT_FILENO, output, output_len);

    json_object_put(jobj_output);
  }

  if (old_trigger != NULL)
    control_led(old_trigger, BRIGHTNESS_UNSET);

  return 0;
}
