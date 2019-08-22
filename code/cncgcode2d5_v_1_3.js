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
        if(d===0)
        {
          x0=x;
          y0=y;
        }
        if(d===pts.length-1 && commands[c][11]===1) txt+="Z";
        else txt+=x.toFixed(3)+","+y.toFixed(3)+" ";
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
