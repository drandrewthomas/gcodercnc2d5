"use strict";

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

