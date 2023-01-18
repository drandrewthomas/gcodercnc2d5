# Changelog

## Version 1.7 (18 Jan 2023)

* Elements now have ID strings (i.e. names).
* ID strings are kept from original SVG file where available.
* Added export to an OpenSCAD file.
* Added chord length dropdown in GCODE and SCAD export dialogs.
* Improved closed path detection.
* Exported SVG files now include CNC project settings.
* Importing SVG files now checks for embedded CNC project settings.
* Internal distance between arc points when loading an SVG file has been reduced to 0.05.
* Bootstrap updated to v4.1.3 for JS and CSS modules.
* Progressive web app abilities have been removed: GCoderCNC is now solely for use in web-browsers.

## Version 1.6 (10 Feb 2020)

* Upgraded code to a Progressive Web App.
* Code files now do not have '2d5' in their filenames.
* Fixed some bugs with transformations in SVG parsing code.
* Minor changes to improve Chrome Lighthouse audit test results.
* Added a new example: a mini CNC shop sign design for LASER etching/cutting.
* Updated icons, and index.html header, for Progressive Web App uses.

## Version 1.5 (21 Nov 2019)

* Added header text and comments to generated GCode.
* Added moving speed selection to GCode export dialog.
* Saving to local storage now includes moving speed.
* Cutting passes can now be processed on a path-by-path or pass-by-pass basis.
* GCode created in LASER mode now has no Z moves.
* Fixed problems with empty (no 'd' element) paths, e.g. as found in Boxy SVG files.
* Added matrix transformations as they are used a lot by Boxy SVG.
* Improved transformations, and changed them to matrix math, for greater SVG compatibility.
* SVG transform functions have been moved to the svgparser javascript file for consistency.
* Where SVG files include rectangle elements with a class of 'BoundingBox' those are now ignored.
* Added a new example: a simple flower router-design for learning V-carving.

## Version 1.4 (1 Sep 2019)

* More minor adjustments to facilitate the Chromebook app.
* Fixed bug with selecting paths on loaded/imported files.

## Version 1.3 (22 Aug 2019)

* When exporting an SVG file paths are now closed using a 'Z' tag if they were closed in the original file import.
* Added a new example SVG file (dragon plaque) in the examples menu.
* Fixed issues with properties dialog boxes and selections when changing to a new file/example.
* Local storage functions have been separated out into a new storage script, with new versions for Chrome storage, to allow creation of a Chromebook app version.
* Various minor improvements and bug fixes.

## Version 1.2 (18 Jun 2019)

* Changed to new properties dialogs that allow better styling and application of themes (QuickSettings.js is now removed).
* All event handler attachment in index.html has been moved to the javascript load function.
* The refresh app item in the help menu has been removed: it isn't needed now that updates have version numbers in file extensions.
* When importing an SVG file with text elements a warning now pops up to tell the user that text must be converted to paths before importing.
* Various other bug fixes and improvements.

## Version 1.1 (22 May 2019)

* Added Filesaver.js for larger and more consistent downloading/saving.
* Added themes menu and a range of visual and colourful themes.
* Added examples to the menu of the same name. That helps with layout in smaller windows and makes using examples easier.
* Selecting paths is now easier as you can select any point along it, instead of just the start of the path. That means you can click pretty much anywhere on a curve/arc, or the start/end vertices of straight line segments.
* Various other bug fixes and improvements.
