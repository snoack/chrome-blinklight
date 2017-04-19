AC_INIT(chrome-blinklight, 1.0)
AM_INIT_AUTOMAKE(foreign)

AC_ARG_WITH(static-jsonc, AS_HELP_STRING([--with-static-jsonc], []), static_jsonc="${withval}")
AM_CONDITIONAL(STATIC_JSONC, [test x$static_jsonc = xyes])

AC_PROG_CC
PKG_CHECK_MODULES(JSONC, json-c, [AC_SUBST(JSONC_LIBDIR, `$PKG_CONFIG --variable=libdir json-c`)])

AC_CONFIG_FILES(Makefile)
AC_OUTPUT
