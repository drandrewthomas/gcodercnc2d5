# Files for testing GCoderCNC

Here you can find various SVG files that have been created for specific GCoderCNC testing purposes:

**Inkscape_100x75_load_test.svg**: This file includes a number of elements, some rotated, for general checking that Inkscape files load correctly. It also includes an image and text element to test that the code detects them on loading (as displayed in the browser's developer console). This file was created using Inkscape version 0.92 on Ubuntu Linux.

**Boxy_100x75_load_test.svg**: This is the same as the Inkscape loading test SVG file, but created online in BoxySVG. This file was created using the Boxy Chromebook WebApp.

**Touchdraw_100x75_load_test.svg**: This is the same as the Inkscape loading test SVG file, but created using Touchdraw. This file was created using the Touchdraw Android app on a Chromebook tablet. However, it does not include a text element as they don't seem to currently export into the SVG file on the Android app.

**LibreDraw_100x75_load_test.svg**: This is the same as the other load tests, but created in LibreDraw. **It will not pass testing as LibreDraw is not currently supported**. However, it is included here to monitor the level of compatibility between versions in case of future attempts to support it. This file was created using LibreOffice version 6.2.8.2 on Ubuntu Linux.

**path_type_test.svg**: This is a simple file used when G-Code generation code is changed to test whether the path-by-path and pass-by-pass router cutting modes are working correctly. It contains a closed and an open path, the closed path should be cut in one go in path-by-path mode: that is, closed paths should not return to safe-z between passes. This file was created using Inkscape version 0.92 on Ubuntu Linux.

**vcarveline_50x45_BL.svg**: This is a simple file containing vertical lines that can be set to each of the ten bottom profiles used for V-Carving. It can be used when relevant code is changed to ensure that bottom-of-cut depths are correctly calculated. This file was created using Inkscape version 0.92 on Ubuntu Linux.
