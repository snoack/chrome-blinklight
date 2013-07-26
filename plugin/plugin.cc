#include <npapi.h>

extern "C" {
  const char *NP_GetMIMEDescription(void) {
    return "application/x-thinkpad-led-control::Thinkpad LED control";
  }

  NPError NP_GetValue(NPP instance, NPPVariable variable, void *value) {
    switch (variable) {
      case NPPVpluginNameString:
        *static_cast<const char **>(value) = "Thinkpad LED control";
        break;
      case NPPVpluginDescriptionString:
        *static_cast<const char **>(value) = "Thinkpad LED control Plugin";
        break;
      default:
        return NPERR_INVALID_PARAM;
        break;
    }
    return NPERR_NO_ERROR;
  }
}
