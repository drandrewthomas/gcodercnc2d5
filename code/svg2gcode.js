// To do:

// Do continued curves path elements Ss and Tt
// Do SVG image elements???
// Improve SVG loading to include matrix() transformation
// Solve end of g element detection???
// Add download toolpaths as SVG file
// Add window resize (and maybe screen orientation) event and code
// Add 'transform' in element data


/* Commands elements:
   [0]  Type: 'L'=lines
   [1]  Array of points [x,y]
   [2]  Cut depth (-1 for default)
   [3]  Cut passes (-1 for default)
   [4]  Feed rate (-1 for default)
   [5]  Spindle speed (-1 for default)
   [6]  Enabled to cut (0=disabled, 1=enabled)
   [7]  Cutting group (1-first to 5-last, -1 for default)
   [8]  Use override values (0-use defaults, 1-use overrides)
   [9]  Bottom profile (-1 for default)
   [10] Something to come
   [11] Something to come
*/


"use strict";


function init()
{
  var c,samp,sample=0;
  createsettings();
  cnccanvas=document.getElementById('svgcanvas');
  cnccanvas.addEventListener('mouseleave',onMouseLeave,false);
  cnccanvas.addEventListener('mouseup',onMouseUp,false);
  cnccanvas.addEventListener('mousedown',onMouseDown,false);
  cnccanvas.addEventListener('mousemove',onMouseMove,false);
  window.addEventListener('resize',onResize,false);
  window.addEventListener("beforeunload",onUnloading,false);
  samp=getQueryVariable("open");
  if(samp!==false)
  {
    sample=-1;
    for(c=0;c<svgsamples.length;c++)
    {
      if(samp.trim().valueOf()===svgsamples[c][1])
      {
        sample=c;
        break;
      }
    }
    if(sample===-1)
    {
      console.log("Couldn't open "+samp.trim().valueOf());
      sample=0;
    }
  }
  loadsettingslocally();
  loadsample(sample);
  layoutapp();
  makesamplesgrid();
  $('#abouttitle').text("About GCoderCNC v"+mainversion+"."+subversion);
}

function createsettings()
{
  defaultsettings=QuickSettings.create(0,5,"Default settings",document.getElementById('appcontainer'));
  defaultsettings.addRange("Default feed rate (mm/min)",10,500,defaultfeed,10);
  defaultsettings.addRange("Default spindle speed (%)",0,100,defaultspeed,5);
  defaultsettings.addNumber("Default depth (mm)",0.2,50,1,0.1);
  defaultsettings.addNumber("Default passes (nr)",1,100,1,1);
  defaultsettings.addDropDown("Default bottom profile",bottomprofilelist);
  defaultsettings.addDropDown("Default group",["First","Second","Third","Fourth","Last"]);
  defaultsettings.setWidth(250);
  defaultsettings.hide();
  selectsettings=QuickSettings.create(0,5,"Edit selection",document.getElementById('appcontainer'));
  selectsettings.addButton("Reverse path direction",reverseselectedpath);
  selectsettings.addBoolean("Include in cutting list",true,cutlistchanged);
  selectsettings.addBoolean("Override defaults",false,overridechanged);
  selectsettings.addRange("Override feed rate (mm/min)",10,500,10);
  selectsettings.addRange("Override spindle speed (%)",0,100,5);
  selectsettings.addNumber("Override depth (mm)",0.2,50,1,0.1);
  selectsettings.addNumber("Override passes (nr)",1,100,1,1);
  selectsettings.addDropDown("Override bottom profile",bottomprofilelist);
  selectsettings.addDropDown("Override group",["First","Second","Third","Fourth","Last"]);
  selectsettings.addButton("Apply override values",updateoverrides);
  selectsettings.setWidth(250);
  selectsettings.hide();
}

function loadsample(sam)
{
  commands=[];
  transforms=[];
  filename=svgsamples[sam][1];
  projecturl=svgsamples[sam][8];
  if(projecturl!=="")
  {
    console.log(projecturl);
    $("#projectlink").attr("href",projecturl);
    $('#projectlink').show();
  }
  else $('#projectlink').hide();
  svgin=svgsamples[sam][6];
  cleansvg();
  parsesvg();
  getbounds();
  moveto(0,0);
  cutterwidth=(xmax-xmin);
  cutterheight=(ymax-ymin);
  cutteraspect=cutterwidth/cutterheight;
  cutterwidth=svgsamples[sam][4];
  cutterheight=cutterwidth/cutteraspect;
  if(svgsamples[sam][2]===1) setcncmode(1);
  else setcncmode(0);
  defaultsettings.show();
  loaded=true;
  layoutapp();
  drawtocanvas("svgcanvas");
  setsvgtexts();
}

function loadfile(e)
{
  projecturl="";
  $('#projectlink').hide();
  commands=[];
  transforms=[];
  svgin=e.target.result;
  cleansvg();
  parsesvg();
  getbounds();
  moveto(0,0);
  cutterwidth=(xmax-xmin);
  cutterheight=(ymax-ymin);
  cutteraspect=cutterwidth/cutterheight;
  defaultsettings.show();
  loaded=true;
  layoutapp();
  drawtocanvas("svgcanvas");
  setsvgtexts();
}

function dofileselected()
{
  var fileInput=document.getElementById('svgfile');
  if(fileInput.files.length===0)
  {
    $('#svgproblemdialog').modal('show');
    return;
  }
  var fname=fileInput.files[0].name;
  fext=fname.substr(fname.lastIndexOf('.')+1).toLowerCase();
  if(fext!=="svg")
  {
    $('#svgproblemdialog').modal('show');
    return;
  }
  filename=fname.substr(0,fname.lastIndexOf('.'));
  var reader=new FileReader();
  reader.addEventListener("load",loadfile,false);
  reader.readAsText(fileInput.files[0]);
}

function settext(txt)
{
  document.getElementById('mytext').innerHTML=txt;
}

function drawtocanvas(can)
{
  var c,d,x,y,lx,ly,sc,pts;
  var ctx,cwidth,cheight;
  ctx=document.getElementById(can).getContext("2d");
  cwidth=ctx.canvas.width;
  cheight=ctx.canvas.height;
  sc=(cwidth-10)/(xmax-xmin);
  switch(originpos)
  {
    case 0: lx=5; ly=cheight-5; break; // Bottom left
    case 1: lx=5; ly=5; break; // Top left
    case 2: lx=cwidth-5; ly=cheight-5; break; // Bottom right
    case 3: lx=cwidth-5; ly=5; break; // Top right
    case 4: lx=cwidth/2; ly=cheight/2; break; // Middle
  }
  ctx.fillStyle='#fff7e1';
  ctx.fillRect(0,0,cwidth,cheight);
  ctx.strokeStyle='#111133';
  ctx.setLineDash([5,5]);
  ctx.moveTo(0, 50);
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(lx,0);
  ctx.lineTo(lx,ctx.canvas.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0,ly);
  ctx.lineTo(ctx.canvas.width,ly);
  ctx.stroke();
  ctx.setLineDash([]);
  // Draw control points
  ctx.lineWidth=1;
  ctx.lineCap='square';
  handles=[];
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L')
    {
      pts=commands[c][1];
      x=pts[0][0]*sc;
      y=pts[0][1]*sc;
      handles.push([x,y]);
      ctx.beginPath();
      ctx.strokeStyle='rgb(0,0,255)';
      if(commands[c][8]===0) ctx.fillStyle='rgb(255,255,255)';
      else                   ctx.fillStyle=ctx.strokeStyle;
      ctx.arc(x+5,y+5,4,0,2*Math.PI,false);
      ctx.fill();
      ctx.stroke();
    }
  }
  // Draw line paths
  ctx.lineWidth=1;
  ctx.lineCap='square';
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L')
    {
      pts=commands[c][1];
      for(d=0;d<pts.length;d++)
      {
        x=pts[d][0]*sc;
        y=pts[d][1]*sc;
        if(d===0)
        {
          if(commands[c][6]===1) ctx.strokeStyle='rgb(0,0,0)';
          else ctx.strokeStyle='rgb(255,0,0)';
          ctx.lineWidth=1;
          ctx.beginPath();
          ctx.moveTo(x+5,y+5);
        }
        else
        {
          ctx.lineTo(x+5,y+5);
        }
      }
      ctx.stroke();
    }
  }
  // Draw selected tool path
  if(selhand>=0)
  {
    pts=commands[selhand][1];
    for(d=0;d<pts.length;d++)
    {
      x=pts[d][0]*sc;
      y=pts[d][1]*sc;
      if(d===0)
      {
        if(commands[selhand][6]===1) ctx.strokeStyle='rgb(0,0,255)';
        else ctx.strokeStyle='rgb(255,0,0)';
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.moveTo(x+5,y+5);
      }
      else
      {
        ctx.lineTo(x+5,y+5);
      }
    }
    ctx.stroke();
  }
}

function downloadcncfile()
{
  var fname=filename+".nc";
  var txt=makecnctext();
  var dl=document.createElement('a');
  dl.setAttribute('href','data:text/plain;charset=utf-8,'+encodeURIComponent(txt));
  dl.setAttribute('download',fname);
  dl.style.display='none';
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
}

function getdefaults()
{
  defaultfeed=defaultsettings.getValue("Default feed rate (mm/min)");
  defaultspeed=defaultsettings.getValue("Default spindle speed (%)");
  defaultcut=defaultsettings.getValue("Default depth (mm)");
  defaultpasses=defaultsettings.getValue("Default passes (nr)");
  defaultgroup=defaultsettings.getValue("Default group").index;
  defaultbottomprofile=defaultsettings.getValue("Default bottom profile").index;
}

function onMouseLeave(evt)
{
  evt.preventDefault();
}

function onMouseUp(evt)
{
  var rect=cnccanvas.getBoundingClientRect();
  var mousex=evt.clientX-rect.left;
  var mousey=evt.clientY-rect.top;
  selecthandle(mousex,mousey);
  evt.preventDefault();
}

function onMouseDown(evt)
{
  evt.preventDefault();
}

function onMouseMove(evt)
{
  evt.preventDefault();
}

function selecthandle(mx,my)
{
  var c,hx,hy,hd,sel=-1,seldist=9999;
  var sd=20; // Radius of selection around handle
  for(c=0;c<handles.length;c++)
  {
    hx=handles[c][0];
    hy=handles[c][1];
    hd=Math.sqrt(Math.pow(mx-hx,2)+Math.pow(my-hy,2));
    if(hd<sd)
    {
      if(hd<seldist)
      {
        sel=c;
        seldist=hd;
      }
    }
  }
  if(sel!==selhand)
  {
    selhand=sel;
    drawtocanvas("svgcanvas");
    toggleselectedui();
  }
}

function toggleselectedui()
{
  if(selhand===-1)
  {
    defaultsettings.show();
    selectsettings.hide();
  }
  else
  {
    stopchangedevents=true;
    selectsettings.setValue("Include in cutting list",false);
    selectsettings.setValue("Override defaults",false);
    if(commands[selhand][6]===1) selectsettings.setValue("Include in cutting list",true);
    if(commands[selhand][8]===1) selectsettings.setValue("Override defaults",true);
    defaultsettings.hide();
    selectsettings.show();  
    if(commands[selhand][8]===0)
    {
      selectsettings.hideControl("Override feed rate (mm/min)");
      selectsettings.hideControl("Override spindle speed (%)");
      selectsettings.hideControl("Override depth (mm)");
      selectsettings.hideControl("Override passes (nr)");
      selectsettings.hideControl("Override bottom profile");
      selectsettings.hideControl("Override group");
      selectsettings.hideControl("Apply override values");
    }
    else
    {
      selectsettings.setValue("Override depth (mm)",commands[selhand][2]);
      selectsettings.setValue("Override passes (nr)",commands[selhand][3]);
      selectsettings.setValue("Override feed rate (mm/min)",commands[selhand][4]);
      selectsettings.setValue("Override spindle speed (%)",commands[selhand][5]);
      selectsettings.setValue("Override bottom profile",commands[selhand][9]);
      selectsettings.setValue("Override group",commands[selhand][7]);
      selectsettings.showControl("Override feed rate (mm/min)");
      selectsettings.showControl("Override spindle speed (%)");
      selectsettings.showControl("Override depth (mm)");
      selectsettings.showControl("Override passes (nr)");
      if(cncmode===0) selectsettings.showControl("Override bottom profile");
      else selectsettings.hideControl("Override bottom profile");
      selectsettings.showControl("Override group");
      selectsettings.showControl("Apply override values");
    }
    stopchangedevents=false;
  }
}

function cutlistchanged()
{
  var inc;
  if(selhand===-1 || stopchangedevents===true) return;
  inc=selectsettings.getValue("Include in cutting list");
  if(inc===false) commands[selhand][6]=0;
  else commands[selhand][6]=1;
  drawtocanvas("svgcanvas");
}

function overridechanged()
{
  var ovr;
  if(selhand===-1 || stopchangedevents===true) return;
  ovr=selectsettings.getValue("Override defaults");
  if(ovr===false)
  {
    commands[selhand][8]=0;
    selectsettings.hideControl("Override feed rate (mm/min)");
    selectsettings.hideControl("Override spindle speed (%)");
    selectsettings.hideControl("Override depth (mm)");
    selectsettings.hideControl("Override passes (nr)");
    selectsettings.hideControl("Override bottom profile");
    selectsettings.hideControl("Override group");
    selectsettings.hideControl("Apply override values");
  }
  else
  {
    commands[selhand][8]=1;
    getdefaults();
    selectsettings.showControl("Override feed rate (mm/min)");
    selectsettings.showControl("Override spindle speed (%)");
    selectsettings.showControl("Override depth (mm)");
    selectsettings.showControl("Override passes (nr)");
    if(cncmode===0) selectsettings.showControl("Override bottom profile");
    else selectsettings.hideControl("Override bottom profile");
    selectsettings.showControl("Override group");
    selectsettings.showControl("Apply override values");
    selectsettings.setValue("Override depth (mm)",defaultcut);
    selectsettings.setValue("Override passes (nr)",defaultpasses);
    selectsettings.setValue("Override feed rate (mm/min)",defaultfeed);
    selectsettings.setValue("Override spindle speed (%)",defaultspeed);
    selectsettings.setValue("Override bottom profile",defaultbottomprofile);
    selectsettings.setValue("Override group",0);
    selectsettings.show();
  }
}

function reverseselectedpath()
{
  var c,pts=[],npts=[];
  if(selhand===-1) return;
  pts=commands[selhand][1];
  for(c=0;c<pts.length;c++)
  {
    npts.push([pts[pts.length-(c+1)][0],pts[pts.length-(c+1)][1]]);
  }
  commands[selhand][1]=npts;
  drawtocanvas("svgcanvas");
}

function updateoverrides()
{
  var ovr=selectsettings.getValue("Override defaults");
  if(ovr===false)
  {
    commands[selhand][2]=-1;
    commands[selhand][3]=-1;
    commands[selhand][4]=-1;
    commands[selhand][5]=-1;
    commands[selhand][7]=-1;
    commands[selhand][8]=0;
    commands[selhand][9]=-1;
  }
  else
  {
    commands[selhand][2]=selectsettings.getValue("Override depth (mm)");
    commands[selhand][3]=selectsettings.getValue("Override passes (nr)");
    commands[selhand][4]=selectsettings.getValue("Override feed rate (mm/min)");
    commands[selhand][5]=selectsettings.getValue("Override spindle speed (%)");
    commands[selhand][7]=selectsettings.getValue("Override group").index;
    commands[selhand][8]=1;
    commands[selhand][9]=selectsettings.getValue("Override bottom profile").index;
  }
}

function layoutapp()
{
  var appw,apph,sc,ctx,cwidth,cheight;
  ctx=cnccanvas.getContext("2d");
  appw=document.getElementById('appcontainer').clientWidth;
  apph=document.getElementById('appcontainer').clientHeight;
  if(loaded===false)
  {
  }
  else
  {
    cwidth=appw-280;
    sc=(cwidth-10)/(xmax-xmin);
    cheight=10+(ymax-ymin)*sc;
    ctx.canvas.width=cwidth;
    ctx.canvas.height=cheight;
    ctx.canvas.style.top=5+'px';
    ctx.canvas.style.left=260+'px';
    drawtocanvas("svgcanvas");
  }
}

function onResize(evt)
{
  layoutapp();
}

function setcncmode(m)
{
  if(cncmode===m) return;
  switch(m)
  {
    case 0: cncmode=0;
            $('#safezdiv').show();
            defaultsettings.showControl("Default depth (mm)");
            selectsettings.showControl("Override depth (mm)");
            defaultsettings.showControl("Default bottom profile");
            document.getElementById("rmode").text="✓ Router mode (with depth)"
            document.getElementById("lmode").text="LASER mode (no depth)"
            break;
    case 1: cncmode=1;
            $('#safezdiv').hide();
            defaultsettings.hideControl("Default depth (mm)");
            selectsettings.hideControl("Override depth (mm)");
            defaultsettings.hideControl("Default bottom profile");
            document.getElementById("rmode").text="Router mode (with depth)"
            document.getElementById("lmode").text="✓ LASER mode (no depth)"
            break;
  }
}

function setcncorigin(o)
{
  var c;
  if(o===originpos) return;
  originpos=o;
  for(c=0;c<5;c++)
  {
    if(c===o) document.getElementById("origin"+c).text="✓ "+origintexts[c];
    else      document.getElementById("origin"+c).text=origintexts[c];
  }
  drawtocanvas("svgcanvas");
}

function setsvgtexts()
{
  $('#ncwidth').val(cutterwidth.toFixed(0));
  $('#ncheight').val(cutterheight.toFixed(0));
  $('#svgncwidth').val(cutterwidth.toFixed(0));
  $('#svgncheight').val(cutterheight.toFixed(0));
}

function generategcode()
{
  var w,h,sz,gm,validated=false;
  w=parseFloat($('#ncwidth').val());
  h=parseFloat($('#ncheight').val());
  sz=parseFloat($('#safez').val());
  gm=$('#grblmode').prop('selectedIndex');
  grblmode=gm;
  if(w>0 && h>0 && sz>=0 && sz<=100 && !isNaN(w) && !isNaN(h) && !isNaN(sz))
    validated=true;
  if(validated===false)
  {
    $('#gcodeerror').show();
    return;
  }
  if(gm===0) maxspeed=1000;
  else       maxspeed=255;
  cutterwidth=w;
  cutterheight=h;
  safez=sz;
  downloadcncfile();
  $('#savegcodefiledialog').modal('hide');
}

function opengcodedialog()
{
  setsvgtexts();
  $('#grblmode option')[grblmode].selected = true;
  $('#safez').val(safez);
  $('#gcodeerror').hide();
  $('#savegcodefiledialog').modal('show');
}

function openimportdialog()
{
  $('#svgfile').val('');
  $('#importbutton').hide();
  $('#importsvgfiledialog').modal('show');
}

function opensvgexportdialog()
{
  setsvgtexts();
  $('#svgexporterror').hide();
  $('#savesvgfiledialog').modal('show');
}

function generatesvgexport()
{
  var w,h,validated=false;
  w=parseFloat($('#svgncwidth').val());
  h=parseFloat($('#svgncheight').val());
  if(w>0 && h>0 && !isNaN(w) && !isNaN(h))
    validated=true;
  if(validated===false)
  {
    $('#svgexporterror').show();
    return;
  }
  cutterwidth=w;
  cutterheight=h;
  downloadsvgfile();
  $('#savesvgfiledialog').modal('hide');
}

function svgfilechanged()
{
  if($('#svgfile').val()!=='') $('#importbutton').show();
  else $('#importbutton').hide();
}

function getQueryVariable(variable)
{
  // Source: https://css-tricks.com/snippets/javascript/get-url-variables/
  var query=window.location.search.substring(1);
  var vars=query.split("&");
  for(var i=0;i<vars.length;i++)
  {
    var pair=vars[i].split("=");
    if(pair[0]==variable){return pair[1];}
  }
  return(false);
}

function downloadsvgfile()
{
  var fname=filename+"_cnc.svg";
  var txt=makecncsvgexport();
  var dl=document.createElement('a');
  dl.setAttribute('href','data:text/plain;charset=utf-8,'+encodeURIComponent(txt));
  dl.setAttribute('download',fname);
  dl.style.display='none';
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
}

function dialogwidthchanged(wel,hel)
{
  var w,h;
  w=parseFloat($('#'+wel).val().replace(/\D/g,''));
  h=w*(1/cutteraspect);
  $('#'+hel).val(h.toFixed(0));
}

function dialogheightchanged(wel,hel)
{
  var w,h;
  h=parseFloat($('#'+hel).val().replace(/\D/g,''));
  w=h*cutteraspect;
  $('#'+wel).val(w.toFixed(0));
}

function opensamplesdialog()
{
  setsampledescription(0);
  $('#samplesdialog').modal('show');
}

function makesamplesgrid()
{
  var c,snum,sname,simage,txt='';
  for(c=0;c<svgsamples.length;c++)
  {
    snum=c;
    sname=svgsamples[c][0];
    simage="./images/th_"+svgsamples[c][1]+".png";
    txt+='<ul class="list-group" style="width: 230px !important;">';
    txt+='<li id="sampleitem'+c+'" onclick="setsampledescription('+snum+')" class="list-group-item sampleslistitem">';
    txt+='<img src="'+simage+'" class="samplesimage" />';
    txt+='<p class="centertext">'+sname+'</p>';
    txt+='</li>';
    txt+='</ul>';
  }
  $('#sampleslist').html(txt);
}

function setsampledescription(sn)
{
  var txt="",sname,stype,slevel,swidth,sheight,ssvg,sdesc,surl;
  sname=svgsamples[sn][0];
  stype=parseInt(svgsamples[sn][2]);  // (0 router 1 laser 2 both)
  slevel=parseInt(svgsamples[sn][3]); // (0 beginner 1 intermediate 2 advanced)
  swidth=parseInt(svgsamples[sn][4]);
  sheight=parseInt(svgsamples[sn][5]);
  ssvg=svgsamples[sn][6];
  sdesc=svgsamples[sn][7];
  surl=svgsamples[sn][8];
  tempsample=sn;
  txt+='<p class="sampledescheading">'+sname+'</p>';
  if(stype===0) txt+='<p class="sampledesctext"> Project type: Router</p>';
  if(stype===1) txt+='<p class="sampledesctext"> Project type: LASER</p>';
  if(stype===2) txt+='<p class="sampledesctext"> Project type: Router or LASER</p>';
  if(slevel===0) txt+='<p class="sampledesctext"> Skill level: Beginner</p>';
  if(slevel===1) txt+='<p class="sampledesctext"> Skill level: Intermediate</p>';
  if(slevel===2) txt+='<p class="sampledesctext"> Skill level: Advanced</p>';
  txt+='<p class="sampledesctext"> Dimensions (WxH): '+swidth+'mm x '+sheight+'mm</p>';
  txt+='<p class="sampledesctext"> Description: '+sdesc+'</p>';
  if(surl!=="")
  {
    txt+='<p><a href="'+surl+'" target="_blank">';
    txt+='Click here to visit the web page for this project (link opens in a new tab).';
    txt+='</a></p>';
  }
  txt+='<p>'+ssvg+'</p>';
  $('#samplesdescription').html(txt);
  $("#gcodercncsvg").attr("width",400);
  $("#gcodercncsvg").attr("height",400*(sheight/swidth));
  $("#gcodercncsvg").attr("preserveAspectRatio","xMinYMin meet");
  $("#gcodercncsvg").attr("viewBox","-5 -5 "+(swidth+10)+" "+(sheight+10));
  $("#gcodercncsvg").attr("style","background-color:#fff7e1");
}

function openthissample()
{
  $('#samplesdialog').modal('hide');
  loadsample(tempsample);
}

function refreshwebapp()
{
  setTimeout(function(){window.location.reload(true);},100);
}

function onUnloading(e)
{
  savesettingslocally();
}

function savesettingslocally()
{
  if(!window.localStorage) return;
  window.localStorage.setItem("grblmode",grblmode);
  window.localStorage.setItem("safez",safez);
}

function loadsettingslocally()
{
  var it;
  it=window.localStorage.getItem("safez");
  if(it!==null && !isNaN(it)) safez=parseFloat(it);
  it=window.localStorage.getItem("grblmode");
  if(it!==null && !isNaN(it)) grblmode=parseInt(it);
  //console.log(window.localStorage);
}
