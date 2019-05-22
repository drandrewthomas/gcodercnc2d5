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
  createsettings();
  cnccanvas=$('#svgcanvas');
  cnccanvas.on('mouseleave',onMouseLeave);
  cnccanvas.on('mouseup',onMouseUp);
  cnccanvas.on('mousedown',onMouseDown);
  cnccanvas.on('mousemove',onMouseMove);
  $(window).on('resize',onResize);
  $(window).on("beforeunload",onUnloading);
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

function changetheme(th)
{
  if(th===theme) return;
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
  selectsettings.addRange("Override feed rate (mm/min)",10,500,10,overridevalueschanged);
  selectsettings.addRange("Override spindle speed (%)",0,100,5,overridevalueschanged);
  selectsettings.addNumber("Override depth (mm)",0.2,50,1,0.1,overridevalueschanged);
  selectsettings.addNumber("Override passes (nr)",1,100,1,1,overridevalueschanged);
  selectsettings.addDropDown("Override bottom profile",bottomprofilelist,overridevalueschanged);
  selectsettings.addDropDown("Override group",["First","Second","Third","Fourth","Last"]);
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

function downloadcncfile()
{
  var fname=filename+".nc";
  var txt=makecnctext();
  var file=new File([txt],fname,{type:"text/plain;charset=utf-8"});
  saveAs(file);
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
    pts=commands[c][1];
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

function OLD___selecthandle(mx,my)
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
    if(commands[selhand][6]===0) selectsettings.hideControl("Override defaults");
    else selectsettings.showControl("Override defaults");
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
      selectsettings.showControl("Override passes (nr)");
      if(cncmode===0)
      {
        selectsettings.showControl("Override bottom profile");
        selectsettings.showControl("Override depth (mm)");
      }
      else
      {
        selectsettings.hideControl("Override bottom profile");
        selectsettings.hideControl("Override depth (mm)");
      }
      selectsettings.showControl("Override group");
    }
    stopchangedevents=false;
  }
}

function cutlistchanged()
{
  var inc;
  if(selhand===-1 || stopchangedevents===true) return;
  inc=selectsettings.getValue("Include in cutting list");
  if(inc===false)
  {
    commands[selhand][6]=0;
    commands[selhand][8]=0;
    selectsettings.setValue("Override defaults",false);
    selectsettings.hideControl("Override defaults");

  }
  else
  {
    commands[selhand][6]=1;
    selectsettings.showControl("Override defaults");
  }
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
    commands[selhand][2]=defaultcut;
    commands[selhand][3]=defaultpasses;
    commands[selhand][4]=defaultfeed;
    commands[selhand][5]=defaultspeed;
    commands[selhand][9]=defaultbottomprofile;
    commands[selhand][7]=defaultgroup;
    selectsettings.showControl("Override feed rate (mm/min)");
    selectsettings.showControl("Override spindle speed (%)");
    selectsettings.showControl("Override passes (nr)");
    if(cncmode===0)
    {
      selectsettings.showControl("Override bottom profile");
      selectsettings.showControl("Override depth (mm)");
    }
    else
    {
      selectsettings.hideControl("Override bottom profile");
      selectsettings.hideControl("Override depth (mm)");
    }
    selectsettings.showControl("Override group");
    selectsettings.showControl("Apply override values");
    selectsettings.setValue("Override depth (mm)",defaultcut);
    selectsettings.setValue("Override passes (nr)",defaultpasses);
    selectsettings.setValue("Override feed rate (mm/min)",defaultfeed);
    selectsettings.setValue("Override spindle speed (%)",defaultspeed);
    selectsettings.setValue("Override bottom profile",defaultbottomprofile);
    selectsettings.setValue("Override group",defaultgroup);
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
  if(cncmode===m) return;
  switch(m)
  {
    case 0: cncmode=0;
            $('#safezdiv').show();
            defaultsettings.showControl("Default depth (mm)");
            selectsettings.showControl("Override depth (mm)");
            defaultsettings.showControl("Default bottom profile");
            selectsettings.showControl("Override bottom profile");
            document.getElementById("rmode").text="✓ Router mode (with depth)"
            document.getElementById("lmode").text="LASER mode (no depth)"
            break;
    case 1: cncmode=1;
            $('#safezdiv').hide();
            defaultsettings.hideControl("Default depth (mm)");
            selectsettings.hideControl("Override depth (mm)");
            defaultsettings.hideControl("Default bottom profile");
            selectsettings.hideControl("Override bottom profile");
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
  savesettingslocally();
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
  var c,tname,txt='';
  for(c=0;c<themes.length;c++)
  {
    tname=themes[c][0];
    if(c===theme) tname="✓ "+tname;
    txt+='<a class="dropdown-item navbardropdownitems" href="#" data-toggle="modal" ';
    txt+='onclick="changetheme('+c+')">'+tname+'</a>'
  }
  $('#themesdropdownitems').html(txt);
}

function makesamplesdropdown()
{
  var c,snum,sname,simage,txt='';
  for(c=0;c<svgsamples.length;c++)
  {
    snum=c;
    sname=svgsamples[c][0];
    simage="./images/th_"+svgsamples[c][1]+".png";
    txt+='<a class="dropdown-item navbardropdownitems" href="#" data-toggle="modal" ';
    txt+='onclick="opensamplesdialog('+c+')">';
    txt+='<img src="'+simage+'" width="75" style="padding-right: 10px;"/>';
    txt+=sname+'</a>'
  }
  $('#samplesdropdownitems').html(txt);
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
  $("#gcodercncsvg").attr("style",canvascol);
}

function openthissample()
{
  $('#samplesdialog').modal('hide');
  loadsample(tempsample);
}

function overridevalueschanged()
{
  commands[selhand][3]=selectsettings.getValue("Override passes (nr)");
  commands[selhand][4]=selectsettings.getValue("Override feed rate (mm/min)");
  commands[selhand][5]=selectsettings.getValue("Override spindle speed (%)");
  commands[selhand][7]=selectsettings.getValue("Override group").index;
  if(cncmode===0) // Router mode
  {
    commands[selhand][2]=selectsettings.getValue("Override depth (mm)");
    commands[selhand][9]=selectsettings.getValue("Override bottom profile").index;
  }
  else // LASER mode
  {
    commands[selhand][2]=defaultcut;
    commands[selhand][9]=defaultbottomprofile;
  }
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


//****************************************************************
//
// GCode making and toolpath functions
//
//****************************************************************

function makecncsvgexport()
{
  var c,d,x,y,pts,txt="";
  getdefaults();
  var sfx=cutterwidth/(xmax-xmin);
  var sfy=cutterheight/(ymax-ymin);
  switch(originpos)
  {
    case 0: originx=0; originy=0; break; // Bottom left
    case 1: originx=0; originy=cutterheight; break; // Top left
    case 2: originx=cutterwidth; originy=0; break; // Bottom right
    case 3: originx=cutterwidth; originy=cutterheight; break; // Top right
    case 4: originx=cutterwidth/2; originy=cutterheight/2; break; // Middle
  }
  txt+='<?xml version="1.0" encoding="utf-8"?>\r\n';
  txt+='<svg id="gcodercncsvg" width="'+cutterwidth+'px" height="'+cutterheight+'px" style="background-color:#FFFFFF" version="1.1" ';
  txt+='xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" ';
  txt+='>\r\n';
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L' && commands[c][6]===1)
    {
      pts=commands[c][1];
      pts=scaletoolpath(pts,sfx,sfy,cutterheight);
      pts=simplifytoolpath(pts,arcdist);
      txt+='  <path d="M ';
      for(d=0;d<pts.length;d++)
      {
        x=pts[d][0]-originx;
        y=(cutterheight-pts[d][1])-originy;
        txt+=x.toFixed(3)+","+y.toFixed(3)+" ";
      }
      txt+='" opacity="1" stroke="#000000" stroke-opacity="1" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-dasharray="none" fill-opacity="0" />\r\n';
    }
  }
  txt+='</svg>\r\n';
  if(txt.length>1450000) alert("File size may prohibit download!");
  return txt;
}

function makecnctext()
{
  var c,d,ct,pass,group,x,y,z,tx,ty,lastx,lasty,lastz,pts,txt="";
  var cfeed,cspeed,cpasses,ccut,cgroup,g0feed;
  getdefaults();
  g0feed=Math.floor(G0feedrate*maxspeed);
  var maxpasses=defaultpasses;
  for(c=0;c<commands.length;c++)
    if(commands[c][8]===1)
      if(commands[c][3]>maxpasses)
        maxpasses=commands[c][3];
  var sfx=cutterwidth/(xmax-xmin);
  var sfy=cutterheight/(ymax-ymin);
  switch(originpos)
  {
    case 0: originx=0; originy=0; break; // Bottom left
    case 1: originx=0; originy=cutterheight; break; // Top left
    case 2: originx=cutterwidth; originy=0; break; // Bottom right
    case 3: originx=cutterwidth; originy=cutterheight; break; // Top right
    case 4: originx=cutterwidth/2; originy=cutterheight/2; break; // Middle
  }
  txt+="G21\r\n"; // Set units to mm
  txt+="G17\r\n"; // Select XY plane
  txt+="G90\r\n"; // Set absolute coordinate mode
  if(cncmode===0)
  {
    txt+="G0 X0 Y0 Z0 F"+g0feed+" S0\r\n"; // Move to work origin
    txt+="M3\r\n";
  }
  else
  {
    txt+="M5\r\n";
    txt+="G0 X0 Y0 F"+g0feed+" S0\r\n"; // Move to work origin
  }
  lastx=0; lasty=0;
  txt+="G91\r\n"; // Set relative coordinate mode
  for(group=0;group<5;group++)
  {
    for(pass=0;pass<maxpasses;pass++)
    {
      for(c=0;c<commands.length;c++)
      {
        if(commands[c][0]==='L' && commands[c][6]===1)
        {
          if(commands[c][8]===0)
          {
            ccut=defaultcut;
            cpasses=defaultpasses;
            cfeed=defaultfeed;
            cspeed=Math.floor((defaultspeed/100)*maxspeed);
            cgroup=defaultgroup;
          }
          else
          {
            ccut=commands[c][2];
            cpasses=commands[c][3];
            cfeed=commands[c][4];
            cspeed=Math.floor((commands[c][5]/100)*maxspeed);
            cgroup=commands[c][7];
          }
          if(cncmode===0) ct=((pass+1)/cpasses)*ccut;
          //******
//          if(cncmode===1) ct=(pass/cpasses)*ccut;
          if(cncmode===1) ct=0;
          //******
          if(pass<cpasses && cgroup===group)
          {
            pts=maketoolpath(c,ct,ccut,sfx,sfy,cutterheight);
            lastz=0;
            for(d=0;d<pts.length;d++)
            {
              tx=pts[d][0];
              ty=pts[d][1];
              x=(tx-originx)-lastx;
              y=(ty-originy)-lasty;
              z=pts[d][2]-lastz;
              lastx=tx-originx;
              lasty=ty-originy;
              lastz=pts[d][2];
              if(d===0)
              {
                txt+="G0 X"+x.toFixed(3)+" Y"+y.toFixed(3)+" F"+g0feed+" S"+cspeed+"\r\n";
                txt+="G0 F"+cfeed+" S"+cspeed+"\r\n";
                if(cncmode===0) txt+="G0 Z-"+safez+"\r\n";
                if(cncmode===1) txt+="G0 Z-"+ct+"\r\n";
                txt+="G0 Z"+z.toFixed(3)+"\r\n";
                if(cncmode===1) txt+="M3\r\n";
              }
              else
              {
                txt+="G1 X"+x.toFixed(3)+" Y"+y.toFixed(3)+" Z"+z.toFixed(3)+"\r\n";
              }
            }
            if(cncmode===1) txt+="M5\r\n";
            txt+="G90\r\nG0 Z0\r\nG91\r\n";
          }
        }
      }
    }
  }
  txt+="G90\r\n"; // Set absolute coordinate mode
  txt+="G0 X0 Y0\r\n"; // Move to work origin
  if(cncmode===0) txt+="M5\r\n";
  txt+="M2\r\n";
  if(txt.length>1450000) alert("File size may prohibit download!");
  return txt;
}

function maketoolpath(path,cutdepth,totaldepth,sfx,sfy,cutterheight)
{
  var c,pts,lastz,profile,plen,cumlen=0,lenprop=0,tmp;
  pts=commands[path][1];
  // Scale to finished dimensions
  pts=scaletoolpath(pts,sfx,sfy,cutterheight);
  // Simplify to sensible segment lengths
  pts=simplifytoolpath(pts,arcdist);
  // If not a flat bottom profile increase the number of points
  if(commands[path][9]!==-1) profile=commands[path][9];
  else profile=defaultbottomprofile;
  if(profile!==0) pts=pathtoarcdistance(pts);
  // Calculate the path  length
  plen=pathlength(pts);
  // Calculate depth based on bottom profile type
  for(c=0;c<pts.length;c++)
  {
    if(c>0)
    {
      cumlen+=mag(pts[c][0]-pts[c-1][0],pts[c][1]-pts[c-1][1]);
      lenprop=cumlen/plen;
    }
    switch(profile)
    {
      case 0: // Flat all along
              pts[c][2]=totaldepth;
              break;
      case 1: // Straight down-up
              if(lenprop<0.5) pts[c][2]=totaldepth*(lenprop*2);
              else            pts[c][2]=totaldepth*((1-lenprop)*2);
              break;
      case 2: // Straight up-down
              if(lenprop<0.5) pts[c][2]=totaldepth-totaldepth*(lenprop*2);
              else            pts[c][2]=totaldepth-totaldepth*((1-lenprop)*2);
              break;
      case 3: // Sine down-up
              pts[c][2]=totaldepth*Math.sin(lenprop*Math.PI);
              break;
      case 4: // Sine up-down
              pts[c][2]=totaldepth-totaldepth*Math.sin(lenprop*Math.PI);
              break;
      case 5: // Straight just down
              pts[c][2]=totaldepth*lenprop;
              break;
      case 6: // Straight just up
              pts[c][2]=totaldepth-totaldepth*lenprop;
              break;
      case 7: // Sine just down
              pts[c][2]=totaldepth*Math.sin(lenprop*Math.PI/2);
              break;
      case 8: // Sine just up
              pts[c][2]=totaldepth-totaldepth*Math.sin(lenprop*Math.PI/2);
              break;
      case 9: // Trapezoid 80% flat
              if(lenprop<0.1)      pts[c][2]=totaldepth*(lenprop*10);
              else if(lenprop>0.9) pts[c][2]=totaldepth*((1-lenprop)*10);
              else                 pts[c][2]=totaldepth;
              break;
    }
  }
  for(c=0;c<pts.length;c++) if(pts[c][2]>cutdepth) pts[c][2]=cutdepth;
  for(c=0;c<pts.length;c++) pts[c][2]*=-1;
  return pts;
}

function scaletoolpath(pts,sfx,sfy,cutterheight)
{
  var c,x,y,newpts=[];
  for(c=0;c<pts.length;c++)
  {
    x=pts[c][0]*sfx;
    y=(cutterheight-(pts[c][1]*sfy));
    newpts.push([x,y,0]);
  }
  return newpts;
}

function simplifytoolpath(pts,ad)
{
  var c,x,y,ox,oy,sx=pts[0][0],sy=pts[0][1],npts=[],bd,fd;
  for(c=0;c<pts.length;c++)
  {
    x=pts[c][0];
    y=pts[c][1];
    if(c===0 || c===(pts.length-1)) npts.push([x,y,0]);
    else
    {
      bd=Math.sqrt(Math.pow(x-sx,2)+Math.pow(y-sy,2));
      ox=pts[c+1][0];
      oy=pts[c+1][1];
      fd=Math.sqrt(Math.pow(x-ox,2)+Math.pow(y-oy,2));
      if(bd>=ad || fd>=(10*ad))
      {
        npts.push([x,y,0]);
        sx=x;
        sy=y;
      }
    }
  }
  return npts;
}

function pathtoarcdistance(pts)
{
  var c,d,p,da,slen,dleft=0,px,py,vx,vy,sx,sy,np,tpts=[];
  if(pts.length<2) return pts;
  tpts.push(pts[0]);
  for(c=1;c<pts.length;c++)
  {
    slen=mag(pts[c][0]-pts[c-1][0],pts[c][1]-pts[c-1][1]);
    if((dleft+slen)<arcdist) dleft+=slen; // I.e. no points to set on current line element
    else
    {
      sx=pts[c-1][0];
      sy=pts[c-1][1];
      vx=pts[c][0]-sx;
      vy=pts[c][1]-sy;
      np=(slen-dleft)/arcdist;
      for(d=0;d<=Math.floor(np);d++)
      {
        da=(dleft+(d*arcdist))/slen;
        px=sx+(da*vx);
        py=sy+(da*vy);
        tpts.push([px,py,0]); // No need to interpolate Z because done before calculating bottom profile
      }
      dleft=slen-(((Math.floor(np)*arcdist)+dleft));
    }
  }
  tpts.push(pts[pts.length-1]);
  return tpts;
}


//****************************************************************
//
// SVG parsing functions
//
//****************************************************************

function cleansvg()
{
  var c,d,sp,ep,ch,brs,i,inst,lines=[],svg='';
  svgin=svgin.replace(/[\n\r]+/g,'');
  svgin=svgin.trim();
  svgin=svgin.replace(/     /g," ");
  svgin=svgin.replace(/    /g," ");
  svgin=svgin.replace(/   /g," ");
  svgin=svgin.replace(/  /g," ");
  svgin=svgin.replace(/<  /g,"<");
  svgin=svgin.replace(/  >/g,">");
  svgin=svgin.replace(/ >/g,">");
  svgin=svgin.replace(/defs \//g,"defs/");
  svgin=svgin.replace(/>/g,">\n");
  if(svgin.includes("<defs"))
  {
    brs=1;
    i=1;
    sp=svgin.indexOf("<defs");
    if(svgin.includes("</defs>"))
    {
      ep=svgin.indexOf("</defs>")+6;
    }
    else
    {
      while((sp+i)<svgin.length)
      {
        ch=svgin.charAt(sp+i);
        if(ch==='<') brs++;
        if(ch==='>') brs--;
        if(brs===0)
        {
          ep=sp+i;
          break;
        }
        i++;
      }
    }
    svgin=svgin.substring(0,sp-1)+svgin.substring(ep+1,svgin.length-1);
  }
  lines=svgin.split("\n");
  for(c=0;c<lines.length;c++)
  {
    inst=false;
    for(d=0;d<svgcommands.length;d++)
    {
      if(lines[c].includes(svgcommands[d])) inst=true;
    }
    if(inst===true) svg+=lines[c]+"\n";
  }
  svgin=svg;
}

function parsesvg()
{
  var c,svgchild,parser,xmldoc,svg;
  svg=svgin.replace('<?xml version="1.0" encoding="utf-8"?>',"");
  if(window.DOMParser)
  {
    parser=new DOMParser();
    xmldoc=parser.parseFromString(svg,"image/svg+xml");
    if(xmldoc.hasChildNodes())
    {
      svgchild=xmldoc.childNodes;
      for(c=0;c<svgchild.length;c++)
      {
        if(svgchild[c].nodeName!=="defs")
        {
          parseelement(svgchild[c]);
        }
      }
    }
  }
}

function parseelement(el)
{
  var c,t,elchild,name,type,cnodes,stroke,strokewidth;
  name=el.nodeName;
  type=el.nodeType;
  cnodes=el.hasChildNodes();
  if(cnodes===true)
  {
    if(name==="g")
    {
      t=el.getAttribute('transform');
      stroke=el.getAttribute('stroke');
      strokewidth=el.getAttribute('stroke-width');
      if(t!==null)
      {
        transforms.push(gettransform(t));
      }
    }
    elchild=el.childNodes;
    for(c=0;c<elchild.length;c++) parseelement(elchild[c]);
    if(name==="g" && t!==null) transforms.pop();
  }
  if(name==='path')
  {
    var path=el.getAttribute('d').trim();
    path=cleanpath(path);
    var paths=splitcompoundpath(path);
    for(c=0;c<paths.length;c++)
    {
      if(c===0) dopathelement(el,paths[c],false);
      else      dopathelement(el,paths[c],true);
    }
  }
  else if(name==='rect') dorectelement(el);
    else if(name==='circle') docircleelement(el);
      else if(name==='ellipse') doellipseelement(el);
        else if(name==='line') dolineelement(el);
          else if(name==='polygon') dopolygonelement(el);
            else if(name==='polyline') dopolylineelement(el);
              else if(name==='image') doimageelement(el);
                else dounknownelement(el);
}

function dounknownelement(el)
{
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

function splitcompoundpath(p)
{
  var c,path=p,paths;
  path=path.replace(/M/g,"*M");
  path=path.replace(/m/g,"*m");
  if(path[0]==='*') path=path.substring(1);
  paths=path.split("*");
  for(c=0;c<paths.length;c++) paths[c]=paths[c].replace(/,\s*$/, "");
  return paths;
}

function cleanpath(p)
{
  var path=p;
  path=path.replace(/M/g," M");
  path=path.replace(/L/g," L");
  path=path.replace(/H/g," H");
  path=path.replace(/V/g," V");
  path=path.replace(/C/g," C");
  path=path.replace(/S/g," S");
  path=path.replace(/Q/g," Q");
  path=path.replace(/T/g," T");
  path=path.replace(/A/g," A");
  path=path.replace(/m/g," m");
  path=path.replace(/l/g," l");
  path=path.replace(/h/g," h");
  path=path.replace(/v/g," v");
  path=path.replace(/c/g," c");
  path=path.replace(/s/g," s");
  path=path.replace(/q/g," q");
  path=path.replace(/t/g," t");
  path=path.replace(/a/g," a");
  path=path.replace(/\t/g,'');
  path=path.replace(/  +/g,' ');
  path=path.replace(/M /g,"M");
  path=path.replace(/L /g,"L");
  path=path.replace(/H /g,"H");
  path=path.replace(/V /g,"V");
  path=path.replace(/C /g,"C");
  path=path.replace(/S /g,"S");
  path=path.replace(/Q /g,"Q");
  path=path.replace(/T /g,"T");
  path=path.replace(/A /g,"A");
  path=path.replace(/M/g,"M,");
  path=path.replace(/L/g,"L,");
  path=path.replace(/H/g,"H,");
  path=path.replace(/V/g,"V,");
  path=path.replace(/C/g,"C,");
  path=path.replace(/S/g,"S,");
  path=path.replace(/Q/g,"Q,");
  path=path.replace(/T/g,"T,");
  path=path.replace(/A/g,"A,");
  path=path.replace(/m /g,"m");
  path=path.replace(/l /g,"l");
  path=path.replace(/h /g,"h");
  path=path.replace(/v /g,"v");
  path=path.replace(/c /g,"c");
  path=path.replace(/s /g,"s");
  path=path.replace(/q /g,"q");
  path=path.replace(/t /g,"t");
  path=path.replace(/a /g,"a");
  path=path.replace(/m/g,"m,");
  path=path.replace(/l/g,"l,");
  path=path.replace(/h/g,"h,");
  path=path.replace(/v/g,"v,");
  path=path.replace(/c/g,"c,");
  path=path.replace(/s/g,"s,");
  path=path.replace(/q/g,"q,");
  path=path.replace(/t/g,"t,");
  path=path.replace(/a/g,"a,");
  path=path.replace(/ /g,",");
  if(path[0]===',') path=path.substring(1);
  return path;
}

function dopathelement(el,p,startlast)
{
//M = moveto
//L = lineto
//H = horizontal lineto
//V = vertical lineto
//C = curveto
//S = smooth curveto
//Q = quadratic Bezier curve
//T = smooth quadratic Bezier curveto
//A = elliptical arc
//Z = closepath 
  var path=p;
  var ind,x,y,xy,ex,ey,x2,y2,x3,y3,x4,y4,mx=0,my=0,pline;
  var ret,en=1,absmode=true,lastcmd='',firstm=true;
  if(startlast===false)
  {
    lastx=0;
    lasty=0;
  }
  var stroke=el.getAttribute('stroke');
  if(stroke==="none") en=0;
  if(path.length<2) return;
  var strokewidth=parseInt(el.getAttribute('stroke-width'));
  var trans=el.getAttribute('transform');
  var tmat=gettransform(trans);
  pline=path.split(',');
  ind=0;
  points=[];
  while(ind<pline.length)
  {
    absmode=true;
    lastcmd=pline[ind];
    if(pline[ind]==="m" || pline[ind]==="l" || pline[ind]==="h" ||
       pline[ind]==="v" || pline[ind]==="c" || pline[ind]==="s" ||
       pline[ind]==="q" || pline[ind]==="t" || pline[ind]==="a")
    {
      pline[ind]=pline[ind].toUpperCase();
      absmode=false;
    }
    if(pline[ind]==='M')
    {
      if(absmode===true)
      {
        x=parseMyFloat(pline[ind+1]);
        y=parseMyFloat(pline[ind+2]);
      }
      else
      {
        x=lastx+parseMyFloat(pline[ind+1]);
        y=lasty+parseMyFloat(pline[ind+2]);
      }
      xy=dotransforms(x,y,tmat);
      if(firstm===true)
      {
        firstm=false;
        points.push([xy[0],xy[1]]);
        mx=xy[0];
        my=xy[1];
        lastx=x;
        lasty=y;
        ind+=3;
      }
      else ind=pline.length; // Ignor compound path elements after first one
    }
    else if(pline[ind]==='L')
    {
      if(absmode===true)
      {
        x=parseMyFloat(pline[ind+1]);
        y=parseMyFloat(pline[ind+2]);
      }
      else
      {
        x=lastx+parseMyFloat(pline[ind+1]);
        y=lasty+parseMyFloat(pline[ind+2]);
      }
      xy=dotransforms(x,y,tmat);
      points.push([xy[0],xy[1]]);
      lastx=x;
      lasty=y;
      ind+=3;
    }
    else if(pline[ind]==='H')
    {
      if(absmode===true) x=parseMyFloat(pline[ind+1]);
      else               x=lastx+parseMyFloat(pline[ind+1]);
      y=lasty;
      xy=dotransforms(x,y,tmat);
      points.push([xy[0],xy[1]]);
      lastx=x;
      lasty=y;
      ind+=2;
    }
    else if(pline[ind]==='V')
    {
      x=lastx;
      if(absmode===true) y=parseMyFloat(pline[ind+1]);
      else               y=lasty+parseMyFloat(pline[ind+1]);
      xy=dotransforms(x,y,tmat);
      points.push([xy[0],xy[1]]);
      lastx=x;
      lasty=y;
      ind+=2;
    }
    else if(pline[ind]==='A')
    {
      var rx=parseMyFloat(pline[ind+1]);
      var ry=parseMyFloat(pline[ind+2]);
      var xrot=parseMyFloat(pline[ind+3]);
      var aflag=parseInt(pline[ind+4]);
      var sflag=parseInt(pline[ind+5]);
      if(absmode===true)
      {
        ex=parseMyFloat(pline[ind+6]);
        ey=parseMyFloat(pline[ind+7]);
      }
      else
      {
        ex=lastx+parseMyFloat(pline[ind+6]);
        ey=lasty+parseMyFloat(pline[ind+7]);
      }
      ret=drawpatharc(lastx,lasty,rx,ry,xrot,aflag,sflag,ex,ey,tmat)
      lastx=ret[0];
      lasty=ret[1];
      ind+=8;
    }
    else if(pline[ind]==='Q')
    {
      if(absmode===true)
      {
        x2=parseMyFloat(pline[ind+1]);
        y2=parseMyFloat(pline[ind+2]);
        x3=parseMyFloat(pline[ind+3]);
        y3=parseMyFloat(pline[ind+4]);
      }
      else
      {
        x2=lastx+parseMyFloat(pline[ind+1]);
        y2=lasty+parseMyFloat(pline[ind+2]);
        x3=lastx+parseMyFloat(pline[ind+3]);
        y3=lasty+parseMyFloat(pline[ind+4]);
      }
      ret=drawquadraticcurve(lastx,lasty,x2,y2,x3,y3,tmat);
      lastx=ret[0];
      lasty=ret[1];
      ind+=5;
    }
    else if(pline[ind]==='C')
    {
      if(absmode===true)
      {
        x2=parseMyFloat(pline[ind+1]);
        y2=parseMyFloat(pline[ind+2]);
        x3=parseMyFloat(pline[ind+3]);
        y3=parseMyFloat(pline[ind+4]);
        x4=parseMyFloat(pline[ind+5]);
        y4=parseMyFloat(pline[ind+6]);
      }
      else
      {
        x2=lastx+parseMyFloat(pline[ind+1]);
        y2=lasty+parseMyFloat(pline[ind+2]);
        x3=lastx+parseMyFloat(pline[ind+3]);
        y3=lasty+parseMyFloat(pline[ind+4]);
        x4=lastx+parseMyFloat(pline[ind+5]);
        y4=lasty+parseMyFloat(pline[ind+6]);
      }
      ret=drawcubicbezier(lastx,lasty,x2,y2,x3,y3,x4,y4,tmat);
      lastx=ret[0];
      lasty=ret[1];
      ind+=7;
    }
    else if(pline[ind]==='S')
    {
      ind+=5;
    }
    else if(pline[ind]==='T')
    {
      ind+=3;
    }
    else if(pline[ind]==='Z' || pline[ind]==='z')
    {
      points.push([mx,my]);
      ind++;
    }
    else
    {
      console.log("Path unknown command : '"+pline[ind]+"' ("+pline[ind].charCodeAt(0)+")");
      console.log(path.length);
      console.log(path);
      ind++;
    }
    if(ind>0 && ind<pline.length)
    {
      if(!("MmLlHhVvCcSsQqTtAaZz".includes(pline[ind])))
      {
        if(lastcmd==='M') lastcmd='L';
        if(lastcmd==='m') lastcmd='l';
        ind--;
        pline[ind]=lastcmd;
      }
    }
  }
  commands.push(['L',points,-1,-1,-1,-1,en,-1,0,-1,0,0]);
}

function dorectelement(el)
{
  var xy,en=1;
  var stroke=el.getAttribute('stroke');
  if(stroke==="none") en=0;
  var x=parseMyFloat(el.getAttribute('x'));
  var y=parseMyFloat(el.getAttribute('y'));
  var w=parseMyFloat(el.getAttribute('width'));
  var h=parseMyFloat(el.getAttribute('height'));
  var rx=parseMyFloat(el.getAttribute('rx'));
  var ry=parseMyFloat(el.getAttribute('ry'));
  if(rx===null && ry!==null) rx=ry;
  if(rx!==null && ry===null) ry=rx;
  var strokewidth=parseInt(el.getAttribute('stroke-width'));
  var trans=el.getAttribute('transform');
  var tmat=gettransform(trans);
  points=[];
  if(rx===null || ry===null || isNaN(rx) || isNaN(ry))
  {
    xy=dotransforms(x,y,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x+w,y,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x+w,y+h,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x,y+h,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x,y,tmat);
    points.push([xy[0],xy[1]]);
  }
  else
  {
    drawarc(x+rx,y+ry,rx,ry,270,90,1,tmat);
    xy=dotransforms(x+rx,y,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x+w-rx,y,tmat);
    points.push([xy[0],xy[1]]);
    drawarc(x+w-rx,y+ry,rx,ry,0,90,1,tmat);
    xy=dotransforms(x+w,y+ry,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x+w,y+h-ry,tmat);
    points.push([xy[0],xy[1]]);
    drawarc(x+w-rx,y+h-ry,rx,ry,90,90,1,tmat);
    xy=dotransforms(x+w-rx,y+h,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x+rx,y+h,tmat);
    points.push([xy[0],xy[1]]);
    drawarc(x+rx,y+h-ry,rx,ry,180,90,1,tmat);
    xy=dotransforms(x,y+h-ry,tmat);
    points.push([xy[0],xy[1]]);
    xy=dotransforms(x,y+ry,tmat);
    points.push([xy[0],xy[1]]);
  }
  commands.push(['L',points,-1,-1,-1,-1,en,-1,0,-1,0,0]);
}
    
function docircleelement(el)
{
  var en=1;
  var stroke=el.getAttribute('stroke');
  if(stroke==="none") en=0;
  var x=parseMyFloat(el.getAttribute('cx'));
  var y=parseMyFloat(el.getAttribute('cy'));
  var r=parseMyFloat(el.getAttribute('r'));
  var strokewidth=parseInt(el.getAttribute('stroke-width'));
  var trans=el.getAttribute('transform');
  var tmat=gettransform(trans);
  points=[];
  drawarc(x,y,r,r,0,360,1,tmat);
  commands.push(['L',points,-1,-1,-1,-1,en,-1,0,-1,0,0]);
}

function doellipseelement(el)
{
  var en=1;
  var stroke=el.getAttribute('stroke');
  if(stroke==="none") en=0;
  var x=parseMyFloat(el.getAttribute('cx'));
  var y=parseMyFloat(el.getAttribute('cy'));
  var rx=parseMyFloat(el.getAttribute('rx'));
  var ry=parseMyFloat(el.getAttribute('ry'));
  var strokewidth=parseInt(el.getAttribute('stroke-width'));
  var trans=el.getAttribute('transform');
  var tmat=gettransform(trans);
  points=[];
  drawarc(x,y,rx,ry,0,360,1,tmat);
  commands.push(['L',points,-1,-1,-1,-1,en,-1,0,-1,0,0]);
}
    
function dolineelement(el)
{
  var xy,en=1;
  var stroke=el.getAttribute('stroke');
  if(stroke==="none") en=0;
  var x1=parseMyFloat(el.getAttribute('x1'));
  var y1=parseMyFloat(el.getAttribute('y1'));
  var x2=parseMyFloat(el.getAttribute('x2'));
  var y2=parseMyFloat(el.getAttribute('y2'));
  var strokewidth=parseInt(el.getAttribute('stroke-width'));
  var trans=el.getAttribute('transform');
  var tmat=gettransform(trans);
  points=[];
  xy=dotransforms(x1,y1,tmat);
  points.push([xy[0],xy[1]]);
  xy=dotransforms(x2,y2,tmat);
  points.push([xy[0],xy[1]]);
  commands.push(['L',points,-1,-1,-1,-1,en,-1,0,-1,0,0]);
}
    
function dopolygonelement(el)
{
  var x,y,xy,sx,sy,c,pline,en=1;
  var stroke=el.getAttribute('stroke');
  if(stroke==="none") en=0;
  var pts=el.getAttribute('points');
  var strokewidth=parseInt(el.getAttribute('stroke-width'));
  var trans=el.getAttribute('transform');
  var tmat=gettransform(trans);
  pline=pts.split(',');
  points=[];
  for(c=0;c<pline.length;c+=2)
  {
    x=parseMyFloat(pline[c]);
    y=parseMyFloat(pline[c+1]);
    xy=dotransforms(x,y,tmat);
    if(c===0)
    {
      points.push([xy[0],xy[1]]);
      sx=xy[0];
      sy=xy[1];
    }
    else points.push([xy[0],xy[1]]);
  }
  points.push([sx,sy]);
  commands.push(['L',points,-1,-1,-1,-1,en,-1,0,-1,0,0]);
}
    
function dopolylineelement(el)
{
  var x,y,xy,c,pline,en=1;
  var stroke=el.getAttribute('stroke');
  if(stroke==="none") en=0;
  var pts=el.getAttribute('points');
  var strokewidth=parseInt(el.getAttribute('stroke-width'));
  var trans=el.getAttribute('transform');
  var tmat=gettransform(trans);
  pline=pts.split(',');
  points=[];
  for(c=0;c<pline.length;c+=2)
  {
    x=parseMyFloat(pline[c]);
    y=parseMyFloat(pline[c+1]);
    xy=dotransforms(x,y,tmat);
    points.push([xy[0],xy[1]]);
  }
  commands.push(['L',points,-1,-1,-1,-1,en,-1,0,-1,0,0]);
}

function doimageelement(el)
{
  var xy,en=1;
  var x=parseMyFloat(el.getAttribute('x'));
  var y=parseMyFloat(el.getAttribute('y'));
  var w=parseMyFloat(el.getAttribute('width'));
  var h=parseMyFloat(el.getAttribute('height'));
  var h=parseMyFloat(el.getAttribute('xlink:href'));
  console.log("IMAGE");
}
    
function drawarc(cx,cy,rx,ry,dsa,sw,dir,tmat)
{ 
  var cang,ang,mx,my,xy,lastx,lasty;
  var sa=(dsa/180)*Math.PI;
  var sweep=Math.abs((sw/180)*Math.PI);
  var astep=sweep/10000;
  for(cang=0;cang<=sweep;cang+=astep)
  {
    ang=sa+(cang*dir);
    if(ang<0) ang+=(2*Math.PI);
    if(ang>(2*Math.PI)) ang-=(2*Math.PI);
    mx=cx+(rx*Math.sin(ang));
    my=cy-(ry*Math.cos(ang));
    if(cang===0 || dist(lastx,lasty,mx,my)>arcdist || cang>=sweep)
    {
      xy=dotransforms(mx,my,tmat);
      points.push([xy[0],xy[1]]);
      lastx=mx;
      lasty=my;
    }
  }
  return [lastx,lasty];
}

function drawquadraticcurve(x1,y1,x2,y2,x3,y3,tmat)
{
  var c,t,x,y,xy,lastx=0,lasty=0;
  var numtries=1000;
  for(c=0;c<=numtries;c++)
  {
    t=c/numtries;
    x=Math.pow(1-t,2)*x1+2*(1-t)*t*x2+Math.pow(t,2)*x3;
    y=Math.pow(1-t,2)*y1+2*(1-t)*t*y2+Math.pow(t,2)*y3;
    if(c===0 || dist(lastx,lasty,x,y)>arcdist || c===(numtries-1))
    {
      xy=dotransforms(x,y,tmat);
      points.push([xy[0],xy[1]]);
      lastx=x;
      lasty=y;
    }
  }
  return [lastx,lasty];
}

function drawpatharc(sx,sy,ttrx,ttry,txrot,aflag,sflag,ex,ey,tmat)
{
  var sweepsteps=10000;
  var cang,ang,mx,my,xy,rxy,lastx=sx,lasty=sy;
  var sa,ea,dir;
  var rx=ttrx;
  var ry=ttry;
  var xrot=(txrot/180)*Math.PI;
  // *** Arc centre based on https://github.com/canvg/canvg/blob/master/src/canvg.js (13Aug18) ***
  var currpx=Math.cos(xrot)*(sx-ex)/2.0+Math.sin(xrot)*(sy-ey)/2.0;
  var currpy=-Math.sin(xrot)*(sx-ex)/2.0+Math.cos(xrot)*(sy-ey)/2.0;
  var l=Math.pow(currpx,2)/Math.pow(rx,2)+Math.pow(currpy,2)/Math.pow(ry,2);
  if(l>1)
  {
    rx*=Math.sqrt(l);
    ry*=Math.sqrt(l);
  }
  var s=(aflag==sflag ? -1 : 1)*Math.sqrt(
    ((Math.pow(rx,2)*Math.pow(ry,2))-(Math.pow(rx,2)*Math.pow(currpy,2))-(Math.pow(ry,2)*Math.pow(currpx,2)))/
    (Math.pow(rx,2)*Math.pow(currpy,2)+Math.pow(ry,2)*Math.pow(currpx,2))
  );
  if(isNaN(s)) s=0;
  var cppx=s*rx*currpy/ry;
  var cppy=s*-ry*currpx/rx;
  var cx=(sx+ex)/2.0+Math.cos(xrot)*cppx-Math.sin(xrot)*cppy;
  var cy=(sy+ey)/2.0+Math.sin(xrot)*cppx+Math.cos(xrot)*cppy;
  var m=function(v){ return Math.sqrt(Math.pow(v[0],2)+Math.pow(v[1],2)); }
  var r=function(u,v){ return(u[0]*v[0]+u[1]*v[1])/(m(u)*m(v)) }
  var a=function(u,v){ return(u[0]*v[1]<u[1]*v[0] ? -1:1)*Math.acos(r(u,v)); }
  sa=a([1,0],[(currpx-cppx)/rx,(currpy-cppy)/ry]);
  var u=[(currpx-cppx)/rx,(currpy-cppy)/ry];
  var v=[(-currpx-cppx)/rx,(-currpy-cppy)/ry];
  var sweep=a(u,v);
  if(r(u,v)<=-1) sweep=Math.PI;
  if(r(u,v)>=1) sweep=0;
  // *** End of arc centre stuff ***
  if(sflag==1) dir=1;
  else         dir=-1;
  var astep=sweep/sweepsteps;
  for(cang=0;cang<=sweepsteps;cang++)
  {
    ang=sa+(cang*Math.abs(astep)*dir);
    if(ang<0) ang+=(2*Math.PI);
    if(ang>(2*Math.PI)) ang-=(2*Math.PI);
    mx=rx*Math.cos(ang);
    my=ry*Math.sin(ang);
    if(xrot!==0 && xrot!==(2*Math.PI))
    {
      rxy=rotatepoint(mx,my,xrot);
      mx=rxy[0];
      my=rxy[1];
    }
    mx+=cx;
    my+=cy;
    if(dist(lastx,lasty,mx,my)>arcdist || cang===0 || cang===sweepsteps)
    {
      xy=dotransforms(mx,my,tmat);
      points.push([xy[0],xy[1]]);
      lastx=mx;
      lasty=my;
    }
  }
  return [lastx,lasty];
}

function drawcubicbezier(ax,ay,bx,by,cx,cy,dx,dy,tmat)
{
  // a is start and d is end. b and c are control points.
  var c,t,x,y,b0,b1,b2,b3,xy,lastx=ax,lasty=ay;
  for(c=0;c<=1000;c++)
  {
    t=c/1000;
    b0=Math.pow(1-t,3);
    b1=3*t*Math.pow(1-t,2);
    b2=3*Math.pow(t,2)*(1-t);
    b3=Math.pow(t,3);
    x=(b0*ax)+(b1*bx)+(b2*cx)+(b3*dx);
    y=(b0*ay)+(b1*by)+(b2*cy)+(b3*dy);
    if(dist(lastx,lasty,x,y)>arcdist || c===0 || c===1000)
    {
      xy=dotransforms(x,y,tmat);
      points.push([xy[0],xy[1]]);
      lastx=x;
      lasty=y;
    }
  }
  return [lastx,lasty];
}


//****************************************************************
//
// Utility functions
//
//****************************************************************

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

function gettransform(trans)
{
  var ttxt,pos,ret;
  var t=[0,0],s=[1,1],r=[0,0,0];
  if(trans!==null)
  {
    pos=trans.search("translate");
    if(pos!=-1)
    {
      ttxt=trans.substring(pos+10);
      pos=ttxt.search('\\)');
      ttxt=ttxt.substring(0,pos);
      t=ttxt.split(' ').join(',').split(',');
    }
    pos=trans.search("scale");
    if(pos!=-1)
    {
      ttxt=trans.substring(pos+6);
      pos=ttxt.search('\\)');
      ttxt=ttxt.substring(0,pos);
      s=ttxt.split(' ').join(',').split(',');
      if(s.length===1) s=[s,s];
    }
    pos=trans.search("rotate");
    if(pos!=-1)
    {
      ttxt=trans.substring(pos+7);
      pos=ttxt.search('\\)');
      ttxt=ttxt.substring(0,pos);
      r=ttxt.split(' ').join(',').split(',');
    }
  }
  ret=[parseFloat(t[0]),parseFloat(t[1])
       ,parseFloat(s[0]),parseFloat(s[1])
       ,parseFloat(r[0]),parseFloat(r[1]),parseFloat(r[2])];
  return ret;
}

function dotransforms(x,y,t)
{
  var c,pt;
  pt=applytransform(x,y,t);
  if(transforms.length>0)
  {
    for(c=transforms.length-1;c>=0;c--)
    {
      pt=applytransform(pt[0],pt[1],transforms[c]);
    }
  }
  return pt;
}

function applytransform(x,y,t)
{
  var px=x,py=y,sdist,sang;
  px*=t[2];
  py*=t[3];
  if(t[4]!=0)
  {
    sdist=mag(px-t[5],py-t[6]);
    sang=getangle(px-t[5],py-t[6]);
    sang-=t[4]*(Math.PI/180);
    px=sdist*Math.sin(sang);
    py=sdist*Math.cos(sang);
    px+=t[5];
    py+=t[6];
  }
  px+=t[0];
  py+=t[1];
  return [px,py];
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

