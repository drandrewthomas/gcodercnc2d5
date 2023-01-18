"use strict";

//****************************************************************
//
// GCode making and toolpath functions
//
//****************************************************************

function makecncsvgexport()
{
  var c,d,x,y,x0,y0,pts,txt="";
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
  txt+=makedefaultsparams()+' ';
  txt+='>\r\n';
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L')
    {
      pts=commands[c][1];
      pts=scaletoolpath(pts,sfx,sfy,cutterheight);
      pts=simplifytoolpath(pts,arcdist);
      txt+='  <path id="'+commands[c][12]+'" d="M ';
      for(d=0;d<pts.length;d++)
      {
        x=pts[d][0]-originx;
        y=(cutterheight-pts[d][1])-originy;
        if(d===0)
        {
          x0=x;
          y0=y;
        }
        if(d===pts.length-1 && commands[c][11]===1) txt+="Z";
        else txt+=x.toFixed(3)+","+y.toFixed(3)+" ";
      }
      txt+='" opacity="1" stroke="#000000" stroke-opacity="1" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-dasharray="none" fill-opacity="0" ';
      txt+=makepathparams(c)+' ';
      txt+='/>\r\n';
    }
  }
  txt+='</svg>\r\n';
  return txt;
}

function makedefaultsparams()
{
  var ptxt="";
  ptxt+='cnccreator="GCODERCNC_'+mainversion+'_'+subversion+'" ';
  ptxt+='cncmode="'+cncmode+'" ';
  ptxt+='originpos="'+originpos+'" ';
  ptxt+='defaultspeed="'+defaultspeed+'" ';
  ptxt+='defaultfeed="'+defaultfeed+'" ';
  ptxt+='defaultgroup="'+defaultgroup+'" ';
  ptxt+='defaultcut="'+defaultcut+'" ';
  ptxt+='defaultpasses="'+defaultpasses+'" ';
  ptxt+='defaultbottomprofile="'+defaultbottomprofile+'"';
  return ptxt;
}

function makepathparams(line)
{
  var ptxt="";
  ptxt+='override="'+commands[line][8]+'" ';
  ptxt+='cutenabled="'+commands[line][6]+'" ';
  ptxt+='closed="'+commands[line][11]+'"';
  if(commands[line][8]===1)
  {
    ptxt+=' cutdepth="'+commands[line][2]+'" ';
    ptxt+='passes="'+commands[line][3]+'" ';
    ptxt+='feedrate="'+commands[line][4]+'" ';
    ptxt+='spindlespeed="'+commands[line][5]+'" ';
    ptxt+='group="'+commands[line][7]+'" ';
    ptxt+='bottomprofile="'+commands[line][9]+'"';
  }
  return ptxt;
}

function makecncscadexport(adist,vot,inc)
{
  var c,d,x,y,x0,y0,pts,txt="",ccut,voff,tid,doinc;
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
  for(c=0;c<commands.length;c++)
  {
    doinc=false;
    if(inc===1) doinc=true;
    else if(inc===0 && commands[c][11]===1) doinc=true;
    tid=commands[c][12];
    if(doinc===true && commands[c][0]==='L' && commands[c][6]===1)
    {
      if(commands[c][8]===0) ccut=defaultcut;
      else ccut=commands[c][2];
      if(vot===0) voff=-ccut/2;
      if(vot===1) voff=0;
      txt+=tid+'('+ccut+',0,0,'+voff+');\r\n';
    }
  }
  txt+='\r\n';
  for(c=0;c<commands.length;c++)
  {
    doinc=false;
    if(inc===1) doinc=true;
    else if(inc===0 && commands[c][11]===1) doinc=true;
    tid=commands[c][12];
    if(doinc===true && commands[c][0]==='L' && commands[c][6]===1)
    {
      pts=commands[c][1];
      pts=scaletoolpath(pts,sfx,sfy,cutterheight);
      pts=simplifytoolpath(pts,adist);
      txt+='module '+tid+'(hgt,dx,dy,dz)\r\n{\r\n';
      txt+='  translate([dx,dy,dz])\r\n';
      txt+='    linear_extrude(height=hgt,center=false,convexity=10)\r\n';
      txt+='      polygon(points=[';
      for(d=0;d<pts.length;d++)
      {
        x=pts[d][0]-originx;
        y=pts[d][1]-originy;
        txt+='['+x.toFixed(3)+','+y.toFixed(3)+']';
        if(d!==pts.length-1) txt+=",";
      }
      txt+=']);\r\n';
      txt+='}\r\n';
      txt+='\r\n';
    }
  }
  return txt;
}

function makecnctext(adist)
{
  makecnccommentheader();
  makecncstartgcode();
  if(passmode===0) makecnctext_pathbypath(adist);
  if(passmode===1) makecnctext_passbypass(adist);
  makecncendgcode();
  if(gcode.length>1450000) alert("File size may prohibit download!");
}

function makecnctext_pathbypath(adist)
{
  var c,d,ct=0,pass,group,x,y,z,tx,ty,lastx,lasty,lastz,pts;
  var cfeed,cspeed,cpasses,ccut,cgroup;
  getdefaults();
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
  lastx=0; lasty=0;
  for(group=0;group<5;group++)
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
        if(cgroup===group)
        {
          lastz=0;
          gcode+="\r\n";
          for(pass=0;pass<cpasses;pass++)
          {
            if(cncmode===0) ct=((pass+1)/cpasses)*ccut;
            pts=maketoolpath(c,ct,ccut,sfx,sfy,cutterheight,adist);
            tx=pts[0][0];
            ty=pts[0][1];
            x=(tx-originx)-lastx;
            y=(ty-originy)-lasty;
            z=pts[0][2]-lastz;
            lastx=tx-originx;
            lasty=ty-originy;
            lastz=pts[0][2];
            gcode+="G0 X"+x.toFixed(3)+" Y"+y.toFixed(3)+" F"+g0feed+" S"+cspeed+"\r\n";
            gcode+="G0 F"+cfeed+" S"+cspeed+"\r\n";
            if(cncmode===0  && (pass===0 || commands[c][11]===0))
              gcode+="G0 Z-"+safez+" ; Move down to top of cut\r\n";
            if(cncmode===0)
              gcode+="G0 Z"+z.toFixed(3)+"\r\n";
            if(cncmode===1  && (pass===0 || commands[c][11]===0))
              gcode+="M3 ; Turn on the LASER\r\n";
            for(d=1;d<pts.length;d++)
            {
              tx=pts[d][0];
              ty=pts[d][1];
              x=(tx-originx)-lastx;
              y=(ty-originy)-lasty;
              z=pts[d][2]-lastz;
              lastx=tx-originx;
              lasty=ty-originy;
              lastz=pts[d][2];
              if(cncmode===0) gcode+="G1 X"+x.toFixed(3)+" Y"+y.toFixed(3)+" Z"+z.toFixed(3)+"\r\n";
              if(cncmode===1) gcode+="G1 X"+x.toFixed(3)+" Y"+y.toFixed(3)+"\r\n";
            }
            if(cncmode===0 && commands[c][11]!==1)
            {
              lastz=0;
              gcode+="G90 ; Set absolute coordinate mode\r\n";
              gcode+="G0 Z0 ; Move up to Safe Z height\r\n";
              gcode+="G91 ; Set relative coordinate mode\r\n";
            }
            if(cncmode===1 && commands[c][11]!==1) gcode+="M5 ; Turn off the LASER\r\n";
          }
          if(cncmode===0 && commands[c][11]===1)
          {
            lastz=0;
            gcode+="G90 ; Set absolute coordinate mode\r\n";
            gcode+="G0 Z0 ; Move up to Safe Z height\r\n";
            gcode+="G91 ; Set relative coordinate mode\r\n";
          }
          if(cncmode===1 && commands[c][11]===1) gcode+="M5 ; Turn off the LASER\r\n";
        }
      }
    }
  }
}

function makecnctext_passbypass(adist)
{
  var c,d,ct,pass,group,x,y,z,tx,ty,lastx,lasty,lastz,pts;
  var cfeed,cspeed,cpasses,ccut,cgroup;
  getdefaults();
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
  lastx=0; lasty=0;
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
          if(cncmode===1) ct=0;
          if(pass<cpasses && cgroup===group)
          {
            pts=maketoolpath(c,ct,ccut,sfx,sfy,cutterheight,adist);
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
                gcode+="G0 X"+x.toFixed(3)+" Y"+y.toFixed(3)+" F"+g0feed+" S"+cspeed+"\r\n";
                gcode+="G0 F"+cfeed+" S"+cspeed+"\r\n";
                if(cncmode===0) gcode+="G0 Z-"+safez+" ; Move down to top of cut\r\n";
                if(cncmode===0) gcode+="G0 Z"+z.toFixed(3)+"\r\n";
                if(cncmode===1) gcode+="M3 ; Turn on the LASER\r\n";
              }
              else
              {
                if(cncmode===0) gcode+="G1 X"+x.toFixed(3)+" Y"+y.toFixed(3)+" Z"+z.toFixed(3)+"\r\n";
                if(cncmode===1) gcode+="G1 X"+x.toFixed(3)+" Y"+y.toFixed(3)+"\r\n";
              }
            }
            if(cncmode===1) gcode+="M5 ; Turn off the LASER\r\n";
            gcode+="G90 ; Set absolute coordinate mode\r\n";
            gcode+="G0 Z0 ; Move up to Safe Z height\r\n";
            gcode+="G91 ; Set relative coordinate mode\r\n";
            gcode+="\r\n";
          }
        }
      }
    }
  }
}

function makecnccommentheader()
{
  var dt,ds,h,m;
  var mths=["January","February","March","April","May","June","July","August","September","October","November","December"]
  dt=new Date();
  h=dt.getHours();
  if(h<10) h="0"+h;
  else h=""+h;
  m=dt.getMinutes();
  if(m<10) m="0"+m;
  else m=""+m;
  ds=""+dt.getDate()+" "+mths[dt.getMonth()]+" "+dt.getFullYear()+" ("+h+":"+m+")";
  gcode="";
  gcode+="; GRBL CNC GCode file\r\n";
  gcode+="; Generated date: "+ds+"\r\n";
  gcode+="; Generated by: GCoderCNC (https://github.com/drandrewthomas/gcodercnc2d5)\r\n";
  gcode+="; Input file: "+filename+"\r\n";
  if(cncmode==0) gcode+="; Cutting mode: Router\r\n";
  if(cncmode==1) gcode+="; Cutting mode: LASER\r\n";
  gcode+="; Origin position: "+origintexts[originpos]+"\r\n";
  gcode+="; Plan dimensions: "+cutterwidth+"mm wide (X-axis) x "+cutterheight+"mm high (Y-axis)\r\n";
  gcode+="; Maximum feed rate: "+getmaxfeedrate()+"mm/min cutting and "+g0feed+"mm/min moving\r\n";
  if(cncmode===0) gcode+="; Maximum cut depth: "+getmaxcutdepth()+"mm\r\n";
  if(cncmode==0) gcode+="; Safe Z offset: "+safez+"mm\r\n";
  gcode+="; GRBL spindle speed maximum: "+maxspeed+"\r\n";
  if(passmode===0) gcode+="; Pass mode: Path by path\r\n";
  if(passmode===1) gcode+="; Pass mode: Pass by pass\r\n";
  gcode+="\r\n";
}

function makecncstartgcode()
{
  gcode+="; Getting the CNC set up\r\n";
  gcode+="G21 ; Set units to mm\r\n"; 
  gcode+="G17 ; Select XY plane\r\n";
  gcode+="G90 ; Set absolute coordinate mode\r\n";
  if(cncmode===0)
  {
    gcode+="G0 X0 Y0 Z0 F"+g0feed+" S0 ; Move to work origin\r\n";
    gcode+="M3 ; Start spindle motor clockwise\r\n";
  }
  else
  {
    gcode+="M5 ; Ensure LASER is turned off\r\n";
    gcode+="G0 X0 Y0 F"+g0feed+" S0 ; Move to work origin\r\n";
  }
  gcode+="G91 ; Set relative coordinate mode\r\n";
  gcode+="\r\n";
  gcode+="; Ready to start cutting/engraving\r\n";
  gcode+="\r\n";
}

function makecncendgcode()
{
  gcode+="\r\n";
  gcode+="; End of cutting - finishing off\r\n"
  gcode+="G90 ; Set absolute coordinate mode\r\n";
  gcode+="G0 X0 Y0 ; Move to work origin\r\n";
  gcode+="M5 ; Ensure the spindle motor or LASER is turned off\r\n";
  gcode+="M2 ; End the program\r\n";
}

function maketoolpath(path,cutdepth,totaldepth,sfx,sfy,cutterheight,adist)
{
  var c,pts,lastz,profile,plen,cumlen=0,lenprop=0,tmp;
  pts=commands[path][1];
  // Scale to finished dimensions
  pts=scaletoolpath(pts,sfx,sfy,cutterheight);
  // Simplify to sensible segment lengths
  pts=simplifytoolpath(pts,adist);
  // If not a flat bottom profile increase the number of points
  if(commands[path][9]!==-1) profile=commands[path][9];
  else profile=defaultbottomprofile;
  if(profile!==0) pts=pathtoarcdistance(pts,adist);
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

function pathtoarcdistance(pts,adist)
{
  var c,d,p,da,slen,dleft=0,px,py,vx,vy,sx,sy,np,tpts=[];
  if(pts.length<2) return pts;
  tpts.push(pts[0]);
  for(c=1;c<pts.length;c++)
  {
    slen=mag(pts[c][0]-pts[c-1][0],pts[c][1]-pts[c-1][1]);
    if((dleft+slen)<adist) dleft+=slen; // I.e. no points to set on current line element
    else
    {
      sx=pts[c-1][0];
      sy=pts[c-1][1];
      vx=pts[c][0]-sx;
      vy=pts[c][1]-sy;
      np=(slen-dleft)/adist;
      for(d=0;d<=Math.floor(np);d++)
      {
        da=(dleft+(d*adist))/slen;
        px=sx+(da*vx);
        py=sy+(da*vy);
        tpts.push([px,py,0]); // No need to interpolate Z because done before calculating bottom profile
      }
      dleft=slen-(((Math.floor(np)*adist)+dleft));
    }
  }
  tpts.push(pts[pts.length-1]);
  return tpts;
}

function getmaxcutdepth()
{
  var c,mc=defaultcut;
  if(cncmode===1) return 0;
  for(c=0;c<commands.length;c++)
    if(commands[c][0]==='L' && commands[c][6]===1)
      if(commands[c][8]!==0)
        if(commands[c][2]>mc) mc=commands[c][2];
  return mc;
}

function getmaxfeedrate()
{
  var c,fr=defaultfeed;
  for(c=0;c<commands.length;c++)
    if(commands[c][0]==='L' && commands[c][6]===1)
      if(commands[c][8]!==0)
        if(commands[c][4]>fr) fr=commands[c][4];
  return fr;
}

