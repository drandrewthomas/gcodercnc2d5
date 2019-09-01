# Changelog

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
