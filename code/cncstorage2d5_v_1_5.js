"use strict";

function savesettingslocally()
{
  if(window.chrome && chrome.app && chrome.app.runtime)
    app_savesettingslocally();
  else
    website_savesettingslocally();
}

function loadsettingslocally()
{
  if(window.chrome && chrome.app && chrome.app.runtime)
    app_loadsettingslocally();
  else
    website_loadsettingslocally();
}

function website_savesettingslocally()
{
  if(!window.localStorage) return;
  window.localStorage.setItem("grblmode",grblmode);
  window.localStorage.setItem("safez",safez);
  window.localStorage.setItem("g0feed",g0feed);
  window.localStorage.setItem("theme",theme);
  window.localStorage.setItem("passmode",passmode);
}

function website_loadsettingslocally()
{
  var it;
  it=window.localStorage.getItem("safez");
  if(it!==null && !isNaN(it)) safez=parseFloat(it);
  it=window.localStorage.getItem("grblmode");
  if(it!==null && !isNaN(it)) grblmode=parseInt(it);
  it=window.localStorage.getItem("g0feed");
  if(it!==null && !isNaN(it)) g0feed=parseInt(it);
  it=window.localStorage.getItem("theme");
  if(it!==null && !isNaN(it)) theme=parseInt(it);
  it=window.localStorage.getItem("passmode");
  if(it!==null && !isNaN(it)) passmode=parseInt(it);
  //console.log(window.localStorage);
}


// CHROME APP VERSION: Use "permissions": [ "storage" ],

function app_savesettingslocally()
{
  chrome.storage.local.set({"grblmode":grblmode},function(){});
  chrome.storage.local.set({"safez":safez},function(){});
  chrome.storage.local.set({"g0feed":g0feed},function(){});
  chrome.storage.local.set({"theme":theme},function(){});
  chrome.storage.local.set({"passmode":passmode},function(){});
}

function app_loadsettingslocally()
{
  chrome.storage.local.get(['safez'],function(result){
    var it=result.safez;
    if(it!==null && !isNaN(it)) safez=parseFloat(it);
  });
  chrome.storage.local.get(['g0feed'],function(result){
    var it=result.g0feed;
    if(it!==null && !isNaN(it)) g0feed=parseFloat(it);
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
  chrome.storage.local.get(['passmode'],function(result){
    var it=result.passmode;
    if(it!==null && !isNaN(it)) passmode=parseInt(it);
  });
}

