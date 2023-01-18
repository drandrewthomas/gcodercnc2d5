"use strict";

//****************************************************************
//
// Page, UI and app functions
//
//****************************************************************

$(window).on('load',function()
{
  var c,samp,sample=0;
  loadsettingslocally();
  makesamplesdropdown();
  makethemesdropdown();
  loadtheme();
  sethandlers();
  cnccanvas=$('#svgcanvas');
  cnccanvas.on('mouseleave',onMouseLeave);
  cnccanvas.on('mouseup',onMouseUp);
  cnccanvas.on('mousedown',onMouseDown);
  cnccanvas.on('mousemove',onMouseMove);
  $(window).on('resize',onResize);
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
  layoutapp();
  $('#abouttitle').text("About GCoderCNC v"+mainversion+"."+subversion);
  loadsample(sample);
});

function sethandlers()
{
  var c;
  $('#openimportdialog').on('click',openimportdialog);
  $('#opengcodedialog').on('click',opengcodedialog);
  $('#opensvgexportdialog').on('click',opensvgexportdialog);
  $('#openscadexportdialog').on('click',openscadexportdialog);
  $('#rmode').on('click',function(){setcncmode(0);});
  $('#lmode').on('click',function(){setcncmode(1);});
  $('#origin0').on('click',function(){setcncorigin(0);});
  $('#origin1').on('click',function(){setcncorigin(1);});
  $('#origin2').on('click',function(){setcncorigin(2);});
  $('#origin3').on('click',function(){setcncorigin(3);});
  $('#origin4').on('click',function(){setcncorigin(4);});
  $('#svgfile').on('change',svgfilechanged);
  $('#importbutton').on('click',dofileselected);
  $('#ncwidth').on('input',function(){dialogwidthchanged('ncwidth','ncheight');});
  $('#ncheight').on('input',function(){dialogheightchanged('ncwidth','ncheight');});
  $('#generategcode').on('click',generategcode);
  $('#svgncwidth').on('input',function(){dialogwidthchanged('svgncwidth','svgncheight');});
  $('#svgncheight').on('input',function(){dialogheightchanged('svgncwidth','svgncheight');});
  $('#scadncwidth').on('input',function(){dialogwidthchanged('scadncwidth','scadncheight');});
  $('#scadncheight').on('input',function(){dialogheightchanged('scadncwidth','scadncheight');});
  $('#generatesvgexport').on('click',generatesvgexport);
  $('#generatescadexport').on('click',generatescadexport);
  $('#openthissample').on('click',openthissample);
  $('#reversebutton').on('click',reverseselectedpath);
  $('#cutcheck').on('change',cutlistchanged);
  $('#overcheck').on('change',overridechanged);
  $('#overfeed').on('change',overridevalueschanged);
  $('#overspeed').on('change',overridevalueschanged);
  $('#overdepth').on('change',overridevalueschanged);
  $('#overpasses').on('change',overridevalueschanged);
  $('#overprofile').on('change',overridevalueschanged);
  $('#overgroup').on('change',overridevalueschanged);
  $('#deffeed').on('change',defaultspeedfeedchanged);
  $('#defspeed').on('change',defaultspeedfeedchanged);
  $('#cutcheck').prop("checked",true);
  $('#overcheck').prop("checked",false);
  $('#deffeedval').html(defaultfeed);
  $('#deffeed').val(defaultfeed);
  $('#defspeedval').html(defaultspeed);
  $('#defspeed').val(defaultspeed);
  $('#defdepth').val(1);
  $('#defpasses').val(1);
  $('#defprofile').prop('selectedIndex',0);
  $('#defgroup').prop('selectedIndex',0);
  $('#overfeedval').html(defaultfeed);
  $('#overfeed').val(defaultfeed);
  $('#overspeedval').html(defaultspeed);
  $('#overspeed').val(defaultspeed);
  $('#overdepth').val(1);
  $('#overpasses').val(1);
  $('#overprofile').prop('selectedIndex',0);
  $('#overgroup').prop('selectedIndex',0);
  $('#defaultprefsbox').show();
  $('#editselectionbox').hide();
}

function changetheme(th)
{
  theme=th;
  makethemesdropdown();
  loadtheme();
  savesettingslocally();
  drawtocanvas('svgcanvas');
}

function loadtheme()
{
  canvascol=themes[theme][6];
  normalline=themes[theme][7];
  selectedline=themes[theme][8];
  overriddenline=themes[theme][9];
  originline=themes[theme][10];
  notinlist=themes[theme][11];
  $('.cncnavbar').css("background-color",themes[theme][1]);
  $('.navbaritems').css("color",themes[theme][2]);
  $('.cncmodalheader').css("color",themes[theme][2]);
  $('.cncmodalheader').css("background-color",themes[theme][1]);
  $('.cncmodalbody').css("background-color",canvascol);
  $('.cncmodalfooter').css("background-color",themes[theme][1]);
  $('#appcontainer').css("background-color",themes[theme][4]);
  $('.sampledesctext').css("color",themes[theme][5]);
  $('.cncmodalbody').css("color",themes[theme][5]);
  $('.gcodeerror').css("color",themes[theme][5]);
  $('.navbarbrand').css("color",themes[theme][3]);
  $('.navbardropdownmenu').css("background-color",themes[theme][1]);
  $('.navbardropdownitems').css("color",themes[theme][2]);
  $('.preference').css("background-color",canvascol);
  $('.preference').css("color",themes[theme][1]);
  $('.prefbutton').css("background-color",canvascol);
  $('.prefbutton').css("color",themes[theme][1]);
  $('.prefbutton').css("border-color",themes[theme][1]);
  $('.preferenceheading').css("background-color",themes[theme][1]);
  $('.preferenceheading').css("color",themes[theme][2]);
}

function loadsample(sam)
{
  selhand=-1;
  resetdefaults();
  $('#defaultprefsbox').show();
  $('#editselectionbox').hide();
  commands=[];
  transforms=[];
  filename=svgsamples[sam][1];
  projecturl=svgsamples[sam][8];
  if(projecturl!=="")
  {
    $("#projectlink").attr("href",projecturl);
    $('#projectlink').show();
  }
  else $('#projectlink').hide();
  svgin=svgsamples[sam][6];
  cleansvg();
  parsesvg();
  getbounds();
  moveto(0,0);
  makepathsforselection();
  cutterwidth=(xmax-xmin);
  cutterheight=(ymax-ymin);
  cutteraspect=cutterwidth/cutterheight;
  cutterwidth=svgsamples[sam][4];
  cutterheight=cutterwidth/cutteraspect;
  loaded=true;
  if(svgsamples[sam][2]===1) setcncmode(1);
  else setcncmode(0);
  $('#defaultprefsbox').show();
  layoutapp();
  checkforclosedpaths();
  drawtocanvas("svgcanvas");
  setsvgtexts();
}

function loadfile(e)
{
  projecturl="";
  $('#projectlink').hide();
  selhand=-1;
  resetdefaults();
  $('#defaultprefsbox').show();
  $('#editselectionbox').hide();
  commands=[];
  transforms=[];
  svgin=e.target.result;
  cleansvg();
  parsesvg();
  getbounds();
  moveto(0,0);
  makepathsforselection();
  cutterwidth=(xmax-xmin);
  cutterheight=(ymax-ymin);
  cutteraspect=cutterwidth/cutterheight;
  $('#defaultprefsbox').show();
  loaded=true;
  updatedefaults();
  setcncorigin(originpos);
  setcncmode(cncmode);
  layoutapp();
  checkforclosedpaths();
  drawtocanvas("svgcanvas");
  setsvgtexts();
  if(textelfound===true) $('#svgtexteldialog').modal('show');
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
  $('#mytext').html(txt);
}

function drawtocanvas(can)
{
  var c,d,x,y,lx,ly,pts;
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
  ctx.fillStyle=canvascol;
  ctx.fillRect(0,0,cwidth,cheight);
  ctx.strokeStyle=originline[0];
  if(originline[1]===0) ctx.setLineDash([]);
  else ctx.setLineDash([5,5]);
  ctx.moveTo(0, 50);
  ctx.lineWidth=originline[2];
  ctx.beginPath();
  ctx.moveTo(lx,0);
  ctx.lineTo(lx,ctx.canvas.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0,ly);
  ctx.lineTo(ctx.canvas.width,ly);
  ctx.stroke();
  // Draw control points
  ctx.setLineDash([]);
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
      if(commands[c][6]===0) ctx.strokeStyle=notinlist[0];
      else if(commands[c][8]===1) ctx.strokeStyle=overriddenline[0];
      else ctx.strokeStyle=normalline[0];
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
          if(commands[c][6]===0)
          {
            ctx.strokeStyle=notinlist[0];
            if(notinlist[1]===0) ctx.setLineDash([]);
            else ctx.setLineDash([5,5]);
            ctx.lineWidth=notinlist[2];
          }
          else if(commands[c][8]===1)
          {
            ctx.strokeStyle=overriddenline[0];
            if(overriddenline[1]===0) ctx.setLineDash([]);
            else ctx.setLineDash([5,5]);
            ctx.lineWidth=overriddenline[2];
          }
          else
          {
            ctx.strokeStyle=normalline[0];
            if(normalline[1]===0) ctx.setLineDash([]);
            else ctx.setLineDash([5,5]);
            ctx.lineWidth=normalline[2];
          }
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
        ctx.strokeStyle=selectedline[0];
        if(selectedline[1]===0) ctx.setLineDash([]);
        else ctx.setLineDash([5,5]);
        ctx.lineWidth=selectedline[2];
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
    ctx.setLineDash([]);
    ctx.lineWidth=1;
  }
}

function downloadcncfile(adist)
{
  var fname=filename+".nc";
  makecnctext(adist);
  var file=new File([gcode],fname,{type:"text/plain;charset=utf-8"});
  saveAs(file);
}

function getdefaults()
{
  defaultfeed=$('#deffeed').val();
  defaultspeed=$('#defspeed').val();
  defaultcut=$('#defdepth').val();
  defaultpasses=$('#defpasses').val();
  defaultgroup=$('#defgroup').prop('selectedIndex');
  defaultbottomprofile=$('#defprofile').prop('selectedIndex');
}

function resetdefaults()
{
  defaultspeed=50;
  defaultfeed=200;
  defaultgroup=0;
  originpos=0;
  defaultcut=1;
  defaultpasses=1;
  defaultbottomprofile=0;
  $('#deffeed').val(defaultfeed);
  $('#defspeed').val(defaultspeed);
  $('#defdepth').val(defaultcut);
  $('#defpasses').val(defaultpasses);
  $('#defgroup').prop('selectedIndex',defaultgroup);
  $('#defprofile').prop('selectedIndex',defaultbottomprofile=0);
  $('#deffeedval').html(defaultfeed);
  $('#defspeedval').html(defaultspeed);
}

function updatedefaults()
{
  $('#deffeed').val(defaultfeed);
  $('#defspeed').val(defaultspeed);
  $('#defdepth').val(defaultcut);
  $('#defpasses').val(defaultpasses);
  $('#defgroup').prop('selectedIndex',defaultgroup);
  $('#defprofile').prop('selectedIndex',defaultbottomprofile);
  $('#deffeedval').html(defaultfeed);
  $('#defspeedval').html(defaultspeed);
}

function onMouseLeave(evt)
{
  evt.preventDefault();
}

function onMouseUp(evt)
{
  var rect=cnccanvas[0].getBoundingClientRect();
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
  var c,d,x,y,hd,pts,sel=-1,seldist=9999;
  var sd=20; // Radius of selection around handle
  for(c=0;c<commands.length;c++)
  {
    pts=commands[c][10];
    for(d=0;d<pts.length;d++)
    {
      x=pts[d][0]*sc;
      y=pts[d][1]*sc;
      hd=Math.sqrt(Math.pow(mx-x,2)+Math.pow(my-y,2));
      if(hd<sd)
      {
        if(hd<seldist)
        {
          sel=c;
          seldist=hd;
        }
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

function makepathsforselection()
{
  var c;
  for(c=0;c<commands.length;c++)
  {
    commands[c][10]=makeselectionpath(commands[c][1]);
  }
}

function makeselectionpath(pts)
{
  var c,d,slen,px,py,dx,dy,sx,sy,ex,ey,np,tpts=[],adist=1;
  if(pts.length<2) return pts;
  tpts.push(pts[0]);
  for(c=1;c<pts.length;c++)
  {
    ex=pts[c][0];
    ey=pts[c][1];
    sx=pts[c-1][0];
    sy=pts[c-1][1];
    slen=mag(sx-ex,sy-ey);
    if(slen<adist) tpts.push([ex,ey]);
    else
    {
      np=Math.floor(slen/adist);
      dx=(ex-sx)/np;
      dy=(ey-sy)/np;
      for(d=0;d<=np;d++)
      {
        px=sx+(d*dx);
        py=sy+(d*dy);
        tpts.push([px,py]);
      }
    }
  }
  tpts.push(pts[pts.length-1]);
  return tpts;
}

function toggleselectedui()
{
  if(selhand===-1)
  {
    $('#defaultprefsbox').show();
    $('#editselectionbox').hide();
  }
  else
  {
    stopchangedevents=true;
    $('#cutcheck').prop("checked",false);
    $('#overcheck').prop("checked",false);
    if(commands[selhand][6]===1) $('#cutcheck').prop("checked",true);
    if(commands[selhand][8]===1) $('#overcheck').prop("checked",true);
    if(commands[selhand][6]===0) $('#overbox').hide();
    else $('#overbox').show();
    $('#defaultprefsbox').hide();
    $('#editselectionbox').show();
    if(commands[selhand][8]===0)
    {
      $('#overridesbox').hide();
    }
    else
    {
      $('#overdepth').val(commands[selhand][2]);
      $('#overpasses').val(commands[selhand][3]);
      $('#overfeed').val(commands[selhand][4]);
      $('#overfeedval').val(commands[selhand][4]);
      $('#overspeed').val(commands[selhand][5]);
      $('#overspeedval').val(commands[selhand][5]);
      $('#overprofile').prop('selectedIndex',commands[selhand][9]);
      $('#overgroup').prop('selectedIndex',commands[selhand][7]);
      $('#overridesbox').show();
      if(cncmode===0)
      {
        $('#overdepthbox').show();
        $('#overprofilebox').show();
      }
      else
      {
        $('#overdepthbox').hide();
        $('#overprofilebox').hide();
      }
    }
    stopchangedevents=false;
  }
}

function cutlistchanged()
{
  var inc;
  if(selhand===-1 || stopchangedevents===true) return;
  inc=$('#cutcheck').prop("checked");
  if(inc===false)
  {
    commands[selhand][6]=0;
    commands[selhand][8]=0;
    $('#overcheck').prop("checked",false);
    $('#overbox').hide();
    $('#overridesbox').hide();
  }
  else
  {
    commands[selhand][6]=1;
    $('#overbox').show();
  }
  drawtocanvas("svgcanvas");
}

function overridechanged()
{
  var ovr;
  if(selhand===-1 || stopchangedevents===true) return;
  ovr=$('#overcheck').prop("checked");
  if(ovr===false)
  {
    commands[selhand][8]=0;
    $('#overridesbox').hide();
  }
  else
  {
    commands[selhand][8]=1;
    getdefaults();
    commands[selhand][2]=defaultcut;
    commands[selhand][3]=defaultpasses;
    commands[selhand][4]=defaultfeed;
    commands[selhand][5]=defaultspeed;
    commands[selhand][9]=defaultbottomprofile;
    commands[selhand][7]=defaultgroup;
    $('#overridesbox').show();
    if(cncmode===0)
    {
      $('#overdepthbox').show();
      $('#overprofilebox').show();
    }
    else
    {
      $('#overdepthbox').hide();
      $('#overprofilebox').hide();
    }
    $('#overdepth').val(defaultcut);
    $('#overpasses').val(defaultpasses);
    $('#overfeed').val(defaultfeed);
    $('#overfeedval').html(defaultfeed);
    $('#overspeed').val(defaultspeed);
    $('#overspeedval').html(defaultspeed);
    $('#overprofile').prop('selectedIndex',defaultbottomprofile);
    $('#overgroup').prop('selectedIndex',defaultgroup);
    $('#overridesbox').show();
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

function layoutapp()
{
  var appw,apph,sc,ctx,cwidth,cheight,rat,oldw,lb=0;
  ctx=cnccanvas[0].getContext("2d");
  appw=$('#appcontainer').width();
  apph=$('#appcontainer').outerHeight()-$('#appnav').outerHeight()-10;
  if(loaded===false)
  {
  }
  else
  {
    cwidth=appw-280;
    sc=(cwidth-10)/(xmax-xmin);
    cheight=(ymax-ymin)*sc;
    if(cheight>(apph-10))
    {
      rat=(apph-10)/cheight;
      oldw=cwidth;
      cwidth*=rat;
      lb=parseInt(oldw-cwidth)/2;
      cheight*=rat;
    }
    cheight+=10;
    cwidth=parseInt(cwidth);
    cheight=parseInt(cheight);
    ctx.canvas.width=cwidth;
    ctx.canvas.height=cheight;
    ctx.canvas.style.top=5+'px';
    ctx.canvas.style.left=(260+lb)+'px';
    drawtocanvas("svgcanvas");
  }
}

function onResize(evt)
{
  layoutapp();
}

function setcncmode(m)
{
  if(loaded===false) return;
  //if(cncmode===m) return;
  switch(m)
  {
    case 0: cncmode=0;
            $('#safezdiv').show();
            $('#defdepthbox').show();
            $('#defprofilebox').show();
            $('#overdepthbox').show();
            $('#overprofilebox').show();
            $('#rmode').text("✓ Router mode (with depth)");
            $('#lmode').text("LASER mode (no depth)");
            break;
    case 1: cncmode=1;
            $('#safezdiv').hide();
            $('#defdepthbox').hide();
            $('#defprofilebox').hide();
            $('#overdepthbox').hide();
            $('#overprofilebox').hide();
            $('#rmode').text("Router mode (with depth)");
            $('#lmode').text("✓ LASER mode (no depth)");
            break;
  }
}

function setcncorigin(o)
{
  var c;
  if(loaded===false) return;
  originpos=o;
  for(c=0;c<5;c++)
  {
    if(c===o) $('#origin'+c).text("✓ "+origintexts[c]);
    else      $('#origin'+c).text(origintexts[c]);
  }
  drawtocanvas("svgcanvas");
}

function setsvgtexts()
{
  $('#ncwidth').val(cutterwidth.toFixed(0));
  $('#ncheight').val(cutterheight.toFixed(0));
  $('#svgncwidth').val(cutterwidth.toFixed(0));
  $('#svgncheight').val(cutterheight.toFixed(0));
  $('#scadncwidth').val(cutterwidth.toFixed(0));
  $('#scadncheight').val(cutterheight.toFixed(0));
}

function generategcode()
{
  var w,h,sz,gm,fr,validated=false,adist,dists=[0.1,0.25,0.5,1,2];
  w=parseFloat($('#ncwidth').val());
  h=parseFloat($('#ncheight').val());
  sz=parseFloat($('#safez').val());
  gm=$('#grblmode').prop('selectedIndex');
  grblmode=gm;
  fr=($('#movespeed').prop('selectedIndex')+1)*50;
  g0feed=fr;
  passmode=$('#passmode').prop('selectedIndex');
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
  adist=dists[$('#gcodecurvequality').prop('selectedIndex')];
  downloadcncfile(adist);
  savesettingslocally();
  $('#savegcodefiledialog').modal('hide');
}

function opengcodedialog()
{
  setsvgtexts();
  $('#grblmode option')[grblmode].selected=true;
  $('#safez').val(safez);
  $('#movespeed').val(g0feed);
  $('#passmode').prop('selectedIndex',passmode);
  $('#gcodeerror').hide();
  $('#savegcodefiledialog').modal('show');
}

function openscadexportdialog()
{
  setsvgtexts();
  $('#scadexporterror').hide();
  $('#savescadfiledialog').modal('show');
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

function generatescadexport()
{
  var w,h,validated=false,inc,voff,adist,dists=[0.1,0.25,0.5,1,2];
  w=parseFloat($('#scadncwidth').val());
  h=parseFloat($('#scadncheight').val());
  if(w>0 && h>0 && !isNaN(w) && !isNaN(h))
    validated=true;
  if(validated===false)
  {
    $('#svgexporterror').show();
    return;
  }
  cutterwidth=w;
  cutterheight=h;
  adist=dists[$('#scadcurvequality').prop('selectedIndex')];
  voff=$('#scadvertpos').prop('selectedIndex')
  inc=$('#scadinclude').prop('selectedIndex')
  downloadscadfile(adist,voff,inc);
  $('#savescadfiledialog').modal('hide');
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

function downloadscadfile(adist,voff,inc)
{
  var fname=filename+"_cnc.scad";
  var txt=makecncscadexport(adist,voff,inc);
  var file=new File([txt],fname,{type:"text/plain;charset=utf-8"});
  saveAs(file);
}

function downloadsvgfile()
{
  var fname=filename+"_cnc.svg";
  var txt=makecncsvgexport();
  var file=new File([txt],fname,{type:"text/plain;charset=utf-8"});
  saveAs(file);
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

function opensamplesdialog(c)
{
  setsampledescription(c);
  $('#samplesbody').scrollTop(0);
  $('#samplesdialog').modal('show');
}

function makethemesdropdown()
{
  var c,tname,id,txt='';
  for(c=0;c<themes.length;c++)
  {
    id="thm"+c;
    tname=themes[c][0];
    if(c===theme) tname="✓ "+tname;
    txt+='<a id="'+id+'"class="dropdown-item navbardropdownitems" href="#" data-toggle="modal" >'+tname+'</a>';
  }
  $('#themesdropdownitems').html(txt);
  $('#thm0').on('click',function(){changetheme(0);});
  $('#thm1').on('click',function(){changetheme(1);});
  $('#thm2').on('click',function(){changetheme(2);});
  $('#thm3').on('click',function(){changetheme(3);});
  $('#thm4').on('click',function(){changetheme(4);});
  $('#thm5').on('click',function(){changetheme(5);});
}

function makesamplesdropdown()
{
  var c,snum,sname,simage,id,txt='';
  for(c=0;c<svgsamples.length;c++)
  {
    snum=c;
    id="sam"+c;
    sname=svgsamples[c][0];
    simage="./images/th_"+svgsamples[c][1]+".png";
    txt+='<a id="'+id+'" class="dropdown-item navbardropdownitems" href="#" data-toggle="modal" >';
    //txt+='onclick="opensamplesdialog('+c+')">';
    txt+='<img src="'+simage+'" width="75" height="56" ';
    txt+='alt="'+sname+'" ';
    txt+='style="padding-right: 10px;"/>';
    txt+=sname+'</a>'
  }
  $('#samplesdropdownitems').html(txt);
  $('#sam0').on('click',function(){opensamplesdialog(0);});
  $('#sam1').on('click',function(){opensamplesdialog(1);});
  $('#sam2').on('click',function(){opensamplesdialog(2);});
  $('#sam3').on('click',function(){opensamplesdialog(3);});
  $('#sam4').on('click',function(){opensamplesdialog(4);});
  $('#sam5').on('click',function(){opensamplesdialog(5);});
  $('#sam6').on('click',function(){opensamplesdialog(6);});
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
  $('#samplename').html(sname);
  if(stype===0) txt+='<p class="sampledesctext"><b>Project type:</b> Router</p>';
  if(stype===1) txt+='<p class="sampledesctext"><b>Project type:</b> LASER</p>';
  if(stype===2) txt+='<p class="sampledesctext"><b>Project type:</b> Router or LASER</p>';
  if(slevel===0) txt+='<p class="sampledesctext"><b>Skill level:</b> Beginner</p>';
  if(slevel===1) txt+='<p class="sampledesctext"><b>Skill level:</b> Intermediate</p>';
  if(slevel===2) txt+='<p class="sampledesctext"><b>Skill level:</b> Advanced</p>';
  txt+='<p class="sampledesctext"><b>Dimensions (WxH):</b> '+swidth+'mm x '+sheight+'mm</p>';
  txt+='<p class="sampledesctext"><b>Description:</b> '+sdesc+'</p>';
  if(surl!=="")
  {
    txt+='<p><a href="'+surl+'" target="_blank" rel="noreferrer">';
    txt+='Click here to visit the web page for this project (link opens in a new tab).';
    txt+='</a></p>';
  }
  txt+='<p>'+ssvg+'</p>';
  $('#samplesdescription').html(txt);
  $("#gcodercncsvg").attr("width",400);
  $("#gcodercncsvg").attr("height",400*(sheight/swidth));
  $("#gcodercncsvg").attr("preserveAspectRatio","xMinYMin meet");
  $("#gcodercncsvg").attr("viewBox","-5 -5 "+(swidth+10)+" "+(sheight+10));
  $("#gcodercncsvg").attr("style",canvascol);
}

function openthissample()
{
  $('#samplesdialog').modal('hide');
  loadsample(tempsample);
}

function defaultspeedfeedchanged()
{
  $('#deffeedval').html($('#deffeed').val());
  $('#defspeedval').html($('#defspeed').val());
}

function overridevalueschanged()
{
  $('#overfeedval').html($('#overfeed').val());
  $('#overspeedval').html($('#overspeed').val());
  commands[selhand][3]=$('#overpasses').val();
  commands[selhand][4]=$('#overfeed').val();
  commands[selhand][5]=$('#overspeed').val();
  commands[selhand][7]=$('#overgroup').prop('selectedIndex');
  if(cncmode===0) // Router mode
  {
    commands[selhand][2]=$('#overdepth').val();
    commands[selhand][9]=$('#overprofile').prop('selectedIndex');
  }
  else // LASER mode
  {
    commands[selhand][2]=defaultcut;
    commands[selhand][9]=defaultbottomprofile;
  }
}

function parseMyFloat(valtxt)
{
  var r=null;
  if(valtxt!==null)
  {
    r=parseFloat(valtxt);
    if(valtxt.includes("e") || valtxt.includes("E"))
    {
      r=parseFloat(r.toFixed(10));
    }
  }
  return r;
}

function getangle(a,b)
{
  if((a==0) && (b==0)) return 0;
  var sang=Math.atan(a/b);
  if(sang<0) sang*=(-1);
  if((a>=0) && (b>=0)) return sang;
  if((a>=0) && (b<=0)) return Math.PI-sang;
  if((a<=0) && (b<=0)) return Math.PI+sang;
  if((a<=0) && (b>=0)) return (2*Math.PI)-sang;
  return 0;
}

function mag(a,b)
{
  return Math.sqrt((a*a)+(b*b));
}

function pathlength(path)
{
  var c,plen=0;
  if(path.length>1)
  {
    for(c=1;c<path.length;c++)
    {
      plen+=mag(path[c][0]-path[c-1][0],path[c][1]-path[c-1][1]);
    }
  }
  return plen;
}

function getbounds()
{
  var c,d,x,y,pts;
  xmin=999999999;
  xmax=-999999999;
  ymin=999999999;
  ymax=-999999999;
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L')
    {
      pts=commands[c][1];
      for(d=0;d<pts.length;d++)
      {
        x=pts[d][0];
        y=pts[d][1];
        if(x<xmin) xmin=x;
        if(x>xmax) xmax=x;
        if(y<ymin) ymin=y;
        if(y>ymax) ymax=y;
      }
    }
  }
}

function moveto(mx,my)
{
  var c,d,x,y,dx,dy,pts;
  dx=xmin-mx;
  dy=ymin-my;
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L')
    {
      pts=commands[c][1];
      for(d=0;d<pts.length;d++)
      {
        x=pts[d][0];
        y=pts[d][1];
        pts[d][0]=x-dx;
        pts[d][1]=y-dy;
      }
    }
  }
  xmin=mx;
  ymin=my;
  xmax=xmax-dx;
  ymax=ymax-dy;
}

function scaleto(w,h)
{
  var sf;
  var wf=w/(xmax-xmin);
  var hf=h/(ymax-ymin);
  if(wf<hf) sf=wf;
  else sf=hf;
  scale(sf);
}

function scale(sc)
{
  var c,d,x,y,pts;
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L')
    {
      pts=commands[c][1];
      for(d=0;d<pts.length;d++)
      {
        x=pts[d][0];
        y=pts[d][1];
        pts[d][0]=x*sc;
        pts[d][1]=y*sc;
      }
    }
  }
  xmin=Math.floor(xmin*sc);
  ymin=Math.floor(ymin*sc);
  xmax=Math.floor(xmax*sc);
  ymax=Math.floor(ymax*sc);
}

function rgb2mono(r,g,b)
{
  return Math.floor(0.2126*r)+(0.7152*g)+(0.0722*b);
}

function dist(sx,sy,ex,ey)
{
  return Math.sqrt(Math.pow(ex-sx,2)+Math.pow(ey-sy,2));
}

function rotatepoint(x,y,a)
{
  var sa=getangle(x,y);
  var m=mag(x,y);
  var ex=m*Math.sin(sa-a);
  var ey=m*Math.cos(sa-a);
  return [ex,ey];
}

