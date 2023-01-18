"use strict";

function savesettingslocally()
{
  if(!window.localStorage) return;
  window.localStorage.setItem("grblmode",grblmode);
  window.localStorage.setItem("safez",safez);
  window.localStorage.setItem("g0feed",g0feed);
  window.localStorage.setItem("theme",theme);
  window.localStorage.setItem("passmode",passmode);
}

function loadsettingslocally()
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

