"use strict";

// ONE VERSION MUST BE COMMENTED OUT !!!


// GENERAL WEB APP VERSION USING WINDOW.LOCALSTORAGE

function savesettingslocally()
{
  if(!window.localStorage) return;
  window.localStorage.setItem("grblmode",grblmode);
  window.localStorage.setItem("safez",safez);
  window.localStorage.setItem("theme",theme);
}

function loadsettingslocally()
{
  var it;
  it=window.localStorage.getItem("safez");
  if(it!==null && !isNaN(it)) safez=parseFloat(it);
  it=window.localStorage.getItem("grblmode");
  if(it!==null && !isNaN(it)) grblmode=parseInt(it);
  it=window.localStorage.getItem("theme");
  if(it!==null && !isNaN(it)) theme=parseInt(it);
  //console.log(window.localStorage);
}


// CHROME APP VERSION USING CHROME.STORAGE
// Use "permissions": [ "storage" ],

/*
function savesettingslocally()
{
  chrome.storage.local.set({"grblmode":grblmode},function(){});
  chrome.storage.local.set({"safez":safez},function(){});
  chrome.storage.local.set({"theme":theme},function(){});
}

function loadsettingslocally()
{
  chrome.storage.local.get(['safez'],function(result){
    var it=result.safez;
    if(it!==null && !isNaN(it)) safez=parseFloat(it);
  });
  chrome.storage.local.get(['grblmode'],function(result){
    var it=result.grblmode;
    if(it!==null && !isNaN(it)) grblmode=parseInt(it);
  });
  chrome.storage.local.get(['theme'],function(result){
    var it=result.theme;
    if(it!==null && !isNaN(it)) theme=parseInt(it);
    setTimeout(function(){changetheme(theme);},10);
  });
}

*/
