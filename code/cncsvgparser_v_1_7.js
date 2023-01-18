"use strict";

//****************************************************************
//
// SVG parsing functions
//
//****************************************************************

function checkforclosedpaths()
{
  var c,pts,sx,sy,ex,ey,dist;
  for(c=0;c<commands.length;c++)
  {
    if(commands[c][0]==='L' && commands[c][11]===0)
    {
      pts=commands[c][1];
      sx=pts[0][0];
      sy=pts[0][1];
      ex=pts[pts.length-1][0];
      ey=pts[pts.length-1][1];
      dist=Math.sqrt(((ex-sx)*(ex-sx))+((ey-sy)*(ey-sy)));
      if(dist<=closedtol) commands[c][11]=1;
    }
  }
}

function makesvgid(el)
{
  var id = el.getAttribute('id');
  if (id === null || id === undefined) id = "path_"+(commands.length+1);
  else
  {
    id=id.replace("-","_");
    id=id.replace(/[^A-Za-z0-9_]/g,'');
    id+="_"+(commands.length+1);
  }
  return id;
}

function cleansvg() {
  var c, d, sp, ep, ch, brs, i, inst, lines = [],
    svg = '';
  svgin = svgin.replace(/[\n\r]+/g, '');
  svgin = svgin.trim();
  svgin = svgin.replace(/     /g, " ");
  svgin = svgin.replace(/    /g, " ");
  svgin = svgin.replace(/   /g, " ");
  svgin = svgin.replace(/  /g, " ");
  svgin = svgin.replace(/<  /g, "<");
  svgin = svgin.replace(/  >/g, ">");
  svgin = svgin.replace(/ >/g, ">");
  svgin = svgin.replace(/defs \//g, "defs/");
  svgin = svgin.replace(/>/g, ">\n");
  if (svgin.includes("<defs")) {
    brs = 1;
    i = 1;
    sp = svgin.indexOf("<defs");
    if (svgin.includes("</defs>")) {
      ep = svgin.indexOf("</defs>") + 6;
    } else {
      while ((sp + i) < svgin.length) {
        ch = svgin.charAt(sp + i);
        if (ch === '<') brs++;
        if (ch === '>') brs--;
        if (brs === 0) {
          ep = sp + i;
          break;
        }
        i++;
      }
    }
    svgin = svgin.substring(0, sp - 1) + svgin.substring(ep + 1, svgin.length - 1);
  }
  lines = svgin.split("\n");
  for (c = 0; c < lines.length; c++) {
    inst = false;
    for (d = 0; d < svgcommands.length; d++) {
      if (lines[c].includes(svgcommands[d])) inst = true;
    }
    if (inst === true) svg += lines[c] + "\n";
  }
  svgin = svg;
}

function parsesvg() {
  var c, svgchild, parser, xmldoc, svg;
  textelfound = false;
  svg = svgin.replace('<?xml version="1.0" encoding="utf-8"?>', "");
  if (window.DOMParser) {
    parser = new DOMParser();
    xmldoc = parser.parseFromString(svg, "image/svg+xml");
    if (xmldoc.hasChildNodes()) {
      svgchild = xmldoc.childNodes;
      for (c = 0; c < svgchild.length; c++) {
        if (svgchild[c].nodeName !== "defs") {
          parseelement(svgchild[c]);
        }
      }
    }
  }
}

function parseelement(el) {
  var c, t, elchild, name, type, cnodes, stroke, strokewidth;
  name = el.nodeName;
  type = el.nodeType;
  cnodes = el.hasChildNodes();
  if (cnodes === true) {
    if (name === "g") {
      t = el.getAttribute('transform');
      stroke = el.getAttribute('stroke');
      strokewidth = el.getAttribute('stroke-width');
      if (t !== null) {
        transforms.push(gettransform(t));
      }
    }
    elchild = el.childNodes;
    for (c = 0; c < elchild.length; c++) parseelement(elchild[c]);
    if (name === "g" && t !== null) transforms.pop();
  }
  if (name === 'svg') checksvgfordefaults(el);
  if (name === 'path') {
    var path = el.getAttribute('d');
    if (path !== null) {
      path = path.trim();
      path = cleanpath(path);
      var paths = splitcompoundpath(path);
      for (c = 0; c < paths.length; c++) {
        if (c === 0) dopathelement(el, paths[c], false);
        else dopathelement(el, paths[c], true);
      }
    }
  } else if (name === 'rect') dorectelement(el);
  else if (name === 'circle') docircleelement(el);
  else if (name === 'ellipse') doellipseelement(el);
  else if (name === 'line') dolineelement(el);
  else if (name === 'polygon') dopolygonelement(el);
  else if (name === 'polyline') dopolylineelement(el);
  else if (name === 'image') doimageelement(el);
  else if (name === 'text') dotextelement(el);
  else dounknownelement(el);
}

function checksvgfordefaults(el)
{
  var p;
  loadedversion="";
  p = el.getAttribute('cnccreator');
  if(p!=null && p!=undefined) loadedversion=p;
console.log("File version: "+loadedversion);
  p = el.getAttribute('cncmode');
  if(p!=null && p!=undefined) cncmode=parseInt(p);
  p = el.getAttribute('originpos');
  if(p!=null && p!=undefined) originpos=parseInt(p);
  p = el.getAttribute('defaultspeed');
  if(p!=null && p!=undefined) defaultspeed=parseInt(p);
  p = el.getAttribute('defaultfeed');
  if(p!=null && p!=undefined) defaultfeed=parseInt(p);
  p = el.getAttribute('defaultgroup');
  if(p!=null && p!=undefined) defaultgroup=parseInt(p);
  p = el.getAttribute('defaultcut');
  if(p!=null && p!=undefined) defaultcut=parseInt(p);
  p = el.getAttribute('defaultpasses');
  if(p!=null && p!=undefined) defaultpasses=parseInt(p);
  p = el.getAttribute('defaultbottomprofile');
  if(p!=null && p!=undefined) defaultbottomprofile=parseInt(p);
}

function dounknownelement(el) {}

function parseMyFloat(valtxt) {
  var r = null;
  if (valtxt !== null) {
    r = parseFloat(valtxt);
    if (valtxt.includes("e") || valtxt.includes("E")) {
      r = parseFloat(r.toFixed(10));
    }
  }
  return r;
}

function splitcompoundpath(p) {
  var c, path = p,
    paths;
  path = path.replace(/M/g, "*M");
  path = path.replace(/m/g, "*m");
  if (path[0] === '*') path = path.substring(1);
  paths = path.split("*");
  for (c = 0; c < paths.length; c++) paths[c] = paths[c].replace(/,\s*$/, "");
  return paths;
}

function cleanpath(p) {
  var path = p;
  path = path.replace(/M/g, " M");
  path = path.replace(/L/g, " L");
  path = path.replace(/H/g, " H");
  path = path.replace(/V/g, " V");
  path = path.replace(/C/g, " C");
  path = path.replace(/S/g, " S");
  path = path.replace(/Q/g, " Q");
  path = path.replace(/T/g, " T");
  path = path.replace(/A/g, " A");
  path = path.replace(/m/g, " m");
  path = path.replace(/l/g, " l");
  path = path.replace(/h/g, " h");
  path = path.replace(/v/g, " v");
  path = path.replace(/c/g, " c");
  path = path.replace(/s/g, " s");
  path = path.replace(/q/g, " q");
  path = path.replace(/t/g, " t");
  path = path.replace(/a/g, " a");
  path = path.replace(/\t/g, '');
  path = path.replace(/  +/g, ' ');
  path = path.replace(/M /g, "M");
  path = path.replace(/L /g, "L");
  path = path.replace(/H /g, "H");
  path = path.replace(/V /g, "V");
  path = path.replace(/C /g, "C");
  path = path.replace(/S /g, "S");
  path = path.replace(/Q /g, "Q");
  path = path.replace(/T /g, "T");
  path = path.replace(/A /g, "A");
  path = path.replace(/M/g, "M,");
  path = path.replace(/L/g, "L,");
  path = path.replace(/H/g, "H,");
  path = path.replace(/V/g, "V,");
  path = path.replace(/C/g, "C,");
  path = path.replace(/S/g, "S,");
  path = path.replace(/Q/g, "Q,");
  path = path.replace(/T/g, "T,");
  path = path.replace(/A/g, "A,");
  path = path.replace(/m /g, "m");
  path = path.replace(/l /g, "l");
  path = path.replace(/h /g, "h");
  path = path.replace(/v /g, "v");
  path = path.replace(/c /g, "c");
  path = path.replace(/s /g, "s");
  path = path.replace(/q /g, "q");
  path = path.replace(/t /g, "t");
  path = path.replace(/a /g, "a");
  path = path.replace(/m/g, "m,");
  path = path.replace(/l/g, "l,");
  path = path.replace(/h/g, "h,");
  path = path.replace(/v/g, "v,");
  path = path.replace(/c/g, "c,");
  path = path.replace(/s/g, "s,");
  path = path.replace(/q/g, "q,");
  path = path.replace(/t/g, "t,");
  path = path.replace(/a/g, "a,");
  path = path.replace(/ /g, ",");
  if (path[0] === ',') path = path.substring(1);
  return path;
}

function dopathelement(el, p, startlast) {
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
  var closed = 0;
  var path = p;
  var ind, x, y, xy, ex, ey, x2, y2, x3, y3, x4, y4, mx = 0,id,
    my = 0,
    pline;
  var ret, en = 1,
    absmode = true,
    lastcmd = '',
    firstm = true;
  if (startlast === false) {
    lastx = 0;
    lasty = 0;
  }
  var stroke = el.getAttribute('stroke');
  if (stroke === "none") en = 0;
  if (path.length < 2) return;
  var strokewidth = parseInt(el.getAttribute('stroke-width'));
  var trans = el.getAttribute('transform');
  var tmat = gettransform(trans);
  pline = path.split(',');
  ind = 0;
  points = [];
  while (ind < pline.length) {
    absmode = true;
    lastcmd = pline[ind];
    if (pline[ind] === "m" || pline[ind] === "l" || pline[ind] === "h" ||
      pline[ind] === "v" || pline[ind] === "c" || pline[ind] === "s" ||
      pline[ind] === "q" || pline[ind] === "t" || pline[ind] === "a") {
      pline[ind] = pline[ind].toUpperCase();
      absmode = false;
    }
    if (pline[ind] === 'M') {
      if (absmode === true) {
        x = parseMyFloat(pline[ind + 1]);
        y = parseMyFloat(pline[ind + 2]);
      } else {
        x = lastx + parseMyFloat(pline[ind + 1]);
        y = lasty + parseMyFloat(pline[ind + 2]);
      }
      xy = dotransforms(x, y, tmat);
      if (firstm === true) {
        firstm = false;
        points.push([xy[0], xy[1]]);
        mx = xy[0];
        my = xy[1];
        lastx = x;
        lasty = y;
        ind += 3;
      } else ind = pline.length; // Ignor compound path elements after first one
    } else if (pline[ind] === 'L') {
      if (absmode === true) {
        x = parseMyFloat(pline[ind + 1]);
        y = parseMyFloat(pline[ind + 2]);
      } else {
        x = lastx + parseMyFloat(pline[ind + 1]);
        y = lasty + parseMyFloat(pline[ind + 2]);
      }
      xy = dotransforms(x, y, tmat);
      points.push([xy[0], xy[1]]);
      lastx = x;
      lasty = y;
      ind += 3;
    } else if (pline[ind] === 'H') {
      if (absmode === true) x = parseMyFloat(pline[ind + 1]);
      else x = lastx + parseMyFloat(pline[ind + 1]);
      y = lasty;
      xy = dotransforms(x, y, tmat);
      points.push([xy[0], xy[1]]);
      lastx = x;
      lasty = y;
      ind += 2;
    } else if (pline[ind] === 'V') {
      x = lastx;
      if (absmode === true) y = parseMyFloat(pline[ind + 1]);
      else y = lasty + parseMyFloat(pline[ind + 1]);
      xy = dotransforms(x, y, tmat);
      points.push([xy[0], xy[1]]);
      lastx = x;
      lasty = y;
      ind += 2;
    } else if (pline[ind] === 'A') {
      var rx = parseMyFloat(pline[ind + 1]);
      var ry = parseMyFloat(pline[ind + 2]);
      var xrot = parseMyFloat(pline[ind + 3]);
      var aflag = parseInt(pline[ind + 4]);
      var sflag = parseInt(pline[ind + 5]);
      if (absmode === true) {
        ex = parseMyFloat(pline[ind + 6]);
        ey = parseMyFloat(pline[ind + 7]);
      } else {
        ex = lastx + parseMyFloat(pline[ind + 6]);
        ey = lasty + parseMyFloat(pline[ind + 7]);
      }
      ret = drawpatharc(lastx, lasty, rx, ry, xrot, aflag, sflag, ex, ey, tmat)
      lastx = ret[0];
      lasty = ret[1];
      ind += 8;
    } else if (pline[ind] === 'Q') {
      if (absmode === true) {
        x2 = parseMyFloat(pline[ind + 1]);
        y2 = parseMyFloat(pline[ind + 2]);
        x3 = parseMyFloat(pline[ind + 3]);
        y3 = parseMyFloat(pline[ind + 4]);
      } else {
        x2 = lastx + parseMyFloat(pline[ind + 1]);
        y2 = lasty + parseMyFloat(pline[ind + 2]);
        x3 = lastx + parseMyFloat(pline[ind + 3]);
        y3 = lasty + parseMyFloat(pline[ind + 4]);
      }
      ret = drawquadraticcurve(lastx, lasty, x2, y2, x3, y3, tmat);
      lastx = ret[0];
      lasty = ret[1];
      ind += 5;
    } else if (pline[ind] === 'C') {
      if (absmode === true) {
        x2 = parseMyFloat(pline[ind + 1]);
        y2 = parseMyFloat(pline[ind + 2]);
        x3 = parseMyFloat(pline[ind + 3]);
        y3 = parseMyFloat(pline[ind + 4]);
        x4 = parseMyFloat(pline[ind + 5]);
        y4 = parseMyFloat(pline[ind + 6]);
      } else {
        x2 = lastx + parseMyFloat(pline[ind + 1]);
        y2 = lasty + parseMyFloat(pline[ind + 2]);
        x3 = lastx + parseMyFloat(pline[ind + 3]);
        y3 = lasty + parseMyFloat(pline[ind + 4]);
        x4 = lastx + parseMyFloat(pline[ind + 5]);
        y4 = lasty + parseMyFloat(pline[ind + 6]);
      }
      ret = drawcubicbezier(lastx, lasty, x2, y2, x3, y3, x4, y4, tmat);
      lastx = ret[0];
      lasty = ret[1];
      ind += 7;
    } else if (pline[ind] === 'S') {
      ind += 5;
    } else if (pline[ind] === 'T') {
      ind += 3;
    } else if (pline[ind] === 'Z' || pline[ind] === 'z') {
      points.push([mx, my]);
      ind++;
      closed = 1;
    } else {
      console.log("Path unknown command : '" + pline[ind] + "' (" + pline[ind].charCodeAt(0) + ")");
      console.log(path.length);
      console.log(path);
      ind++;
    }
    if (ind > 0 && ind < pline.length) {
      if (!("MmLlHhVvCcSsQqTtAaZz".includes(pline[ind]))) {
        if (lastcmd === 'M') lastcmd = 'L';
        if (lastcmd === 'm') lastcmd = 'l';
        ind--;
        pline[ind] = lastcmd;
      }
    }
  }
  id=makesvgid(el);
  commands.push(['L', points, -1, -1, -1, -1, en, -1, 0, -1, 0, closed, id]);
  checklastpathforoverrides(el);
}

function checklastpathforoverrides(el)
{
  var p;
  var ind=commands.length-1;
  p = el.getAttribute('override');
  if(p!=null && p!=undefined) commands[ind][8]=parseInt(p);
  p = el.getAttribute('cutenabled');
  if(p!=null && p!=undefined) commands[ind][6]=parseInt(p);
  p = el.getAttribute('closed');
  if(p!=null && p!=undefined) commands[ind][11]=parseInt(p);
  if(commands[ind][8]===1)
  {
    p = el.getAttribute('cutdepth');
    if(p!=null && p!=undefined) commands[ind][2]=parseInt(p);
    p = el.getAttribute('passes');
    if(p!=null && p!=undefined) commands[ind][3]=parseInt(p);
    p = el.getAttribute('feedrate');
    if(p!=null && p!=undefined) commands[ind][4]=parseInt(p);
    p = el.getAttribute('spindlespeed');
    if(p!=null && p!=undefined) commands[ind][5]=parseInt(p);
    p = el.getAttribute('group');
    if(p!=null && p!=undefined) commands[ind][7]=parseInt(p);
    p = el.getAttribute('bottomprofile');
    if(p!=null && p!=undefined) commands[ind][9]=parseInt(p);
  }
  
}

function dorectelement(el) {
  var closed = 1;
  var xy, en = 1,id;
  var cl = el.getAttribute('class');
  if(cl === "BoundingBox") return;
  var stroke = el.getAttribute('stroke');
  if (stroke === "none") en = 0;
  var x = parseMyFloat(el.getAttribute('x'));
  var y = parseMyFloat(el.getAttribute('y'));
  var w = parseMyFloat(el.getAttribute('width'));
  var h = parseMyFloat(el.getAttribute('height'));
  var rx = parseMyFloat(el.getAttribute('rx'));
  var ry = parseMyFloat(el.getAttribute('ry'));
  if (rx === null && ry !== null) rx = ry;
  if (rx !== null && ry === null) ry = rx;
  var strokewidth = parseInt(el.getAttribute('stroke-width'));
  var trans = el.getAttribute('transform');
  var tmat = gettransform(trans);
  points = [];
  if (rx === null || ry === null || isNaN(rx) || isNaN(ry)) {
    xy = dotransforms(x, y, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x + w, y, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x + w, y + h, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x, y + h, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x, y, tmat);
    points.push([xy[0], xy[1]]);
  } else {
    drawarc(x + rx, y + ry, rx, ry, 270, 90, 1, tmat);
    xy = dotransforms(x + rx, y, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x + w - rx, y, tmat);
    points.push([xy[0], xy[1]]);
    drawarc(x + w - rx, y + ry, rx, ry, 0, 90, 1, tmat);
    xy = dotransforms(x + w, y + ry, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x + w, y + h - ry, tmat);
    points.push([xy[0], xy[1]]);
    drawarc(x + w - rx, y + h - ry, rx, ry, 90, 90, 1, tmat);
    xy = dotransforms(x + w - rx, y + h, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x + rx, y + h, tmat);
    points.push([xy[0], xy[1]]);
    drawarc(x + rx, y + h - ry, rx, ry, 180, 90, 1, tmat);
    xy = dotransforms(x, y + h - ry, tmat);
    points.push([xy[0], xy[1]]);
    xy = dotransforms(x, y + ry, tmat);
    points.push([xy[0], xy[1]]);
  }
  id=makesvgid(el);
  commands.push(['L', points, -1, -1, -1, -1, en, -1, 0, -1, 0, closed,id]);
}

function docircleelement(el) {
  var closed = 1;
  var en = 1,id;
  var stroke = el.getAttribute('stroke');
  if (stroke === "none") en = 0;
  var x = parseMyFloat(el.getAttribute('cx'));
  var y = parseMyFloat(el.getAttribute('cy'));
  var r = parseMyFloat(el.getAttribute('r'));
  var strokewidth = parseInt(el.getAttribute('stroke-width'));
  var trans = el.getAttribute('transform');
  var tmat = gettransform(trans);
  points = [];
  drawarc(x, y, r, r, 0, 360, 1, tmat);
  id=makesvgid(el);
  commands.push(['L', points, -1, -1, -1, -1, en, -1, 0, -1, 0, closed,id]);
}

function doellipseelement(el) {
  var closed = 1;
  var en = 1,id;
  var stroke = el.getAttribute('stroke');
  if (stroke === "none") en = 0;
  var x = parseMyFloat(el.getAttribute('cx'));
  var y = parseMyFloat(el.getAttribute('cy'));
  var rx = parseMyFloat(el.getAttribute('rx'));
  var ry = parseMyFloat(el.getAttribute('ry'));
  var strokewidth = parseInt(el.getAttribute('stroke-width'));
  var trans = el.getAttribute('transform');
  var tmat = gettransform(trans);
  points = [];
  drawarc(x, y, rx, ry, 0, 360, 1, tmat);
  id=makesvgid(el);
  commands.push(['L', points, -1, -1, -1, -1, en, -1, 0, -1, 0, closed,id]);
}

function dolineelement(el) {
  var closed = 0;
  var xy, en = 1,id;
  var stroke = el.getAttribute('stroke');
  if (stroke === "none") en = 0;
  var x1 = parseMyFloat(el.getAttribute('x1'));
  var y1 = parseMyFloat(el.getAttribute('y1'));
  var x2 = parseMyFloat(el.getAttribute('x2'));
  var y2 = parseMyFloat(el.getAttribute('y2'));
  var strokewidth = parseInt(el.getAttribute('stroke-width'));
  var trans = el.getAttribute('transform');
  var tmat = gettransform(trans);
  points = [];
  xy = dotransforms(x1, y1, tmat);
  points.push([xy[0], xy[1]]);
  xy = dotransforms(x2, y2, tmat);
  points.push([xy[0], xy[1]]);
  id=makesvgid(el);
  commands.push(['L', points, -1, -1, -1, -1, en, -1, 0, -1, 0, closed,id]);
}

function dopolygonelement(el) {
  var closed = 1;
  var x, y, xy, sx, sy, c, pline, en = 1,id;
  var stroke = el.getAttribute('stroke');
  if (stroke === "none") en = 0;
  var pts = el.getAttribute('points');
  var strokewidth = parseInt(el.getAttribute('stroke-width'));
  var trans = el.getAttribute('transform');
  var tmat = gettransform(trans);
  pline = pts.split(',');
  points = [];
  for (c = 0; c < pline.length; c += 2) {
    x = parseMyFloat(pline[c]);
    y = parseMyFloat(pline[c + 1]);
    xy = dotransforms(x, y, tmat);
    if (c === 0) {
      points.push([xy[0], xy[1]]);
      sx = xy[0];
      sy = xy[1];
    } else points.push([xy[0], xy[1]]);
  }
  points.push([sx, sy]);
  id=makesvgid(el);
  commands.push(['L', points, -1, -1, -1, -1, en, -1, 0, -1, 0, closed,id]);
}

function dopolylineelement(el) {
  var closed = 0;
  var x, y, xy, c, pline, en = 1,id;
  var stroke = el.getAttribute('stroke');
  if (stroke === "none") en = 0;
  var pts = el.getAttribute('points');
  var strokewidth = parseInt(el.getAttribute('stroke-width'));
  var trans = el.getAttribute('transform');
  var tmat = gettransform(trans);
  pline = pts.split(',');
  points = [];
  for (c = 0; c < pline.length; c += 2) {
    x = parseMyFloat(pline[c]);
    y = parseMyFloat(pline[c + 1]);
    xy = dotransforms(x, y, tmat);
    points.push([xy[0], xy[1]]);
  }
  if (points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1])
    closed = 1;
  id=makesvgid(el);
  commands.push(['L', points, -1, -1, -1, -1, en, -1, 0, -1, 0, closed,id]);
}

function doimageelement(el) {
  var xy, en = 1;
  var x = parseMyFloat(el.getAttribute('x'));
  var y = parseMyFloat(el.getAttribute('y'));
  var w = parseMyFloat(el.getAttribute('width'));
  var h = parseMyFloat(el.getAttribute('height'));
  var h = parseMyFloat(el.getAttribute('xlink:href'));
  console.log("IMAGE");
}

function dotextelement(el) {
  textelfound = true;
  console.log("TEXT");
}

function drawarc(cx, cy, rx, ry, dsa, sw, dir, tmat) {
  var cang, ang, mx, my, xy, lastx, lasty;
  var sa = (dsa / 180) * Math.PI;
  var sweep = Math.abs((sw / 180) * Math.PI);
  var astep = sweep / 10000;
  for (cang = 0; cang <= sweep; cang += astep) {
    ang = sa + (cang * dir);
    if (ang < 0) ang += (2 * Math.PI);
    if (ang > (2 * Math.PI)) ang -= (2 * Math.PI);
    mx = cx + (rx * Math.sin(ang));
    my = cy - (ry * Math.cos(ang));
    if (cang === 0 || dist(lastx, lasty, mx, my) > arcdist || cang >= sweep) {
      xy = dotransforms(mx, my, tmat);
      points.push([xy[0], xy[1]]);
      lastx = mx;
      lasty = my;
    }
  }
  return [lastx, lasty];
}

function drawquadraticcurve(x1, y1, x2, y2, x3, y3, tmat) {
  var c, t, x, y, xy, lastx = 0,
    lasty = 0;
  var numtries = 1000;
  for (c = 0; c <= numtries; c++) {
    t = c / numtries;
    x = Math.pow(1 - t, 2) * x1 + 2 * (1 - t) * t * x2 + Math.pow(t, 2) * x3;
    y = Math.pow(1 - t, 2) * y1 + 2 * (1 - t) * t * y2 + Math.pow(t, 2) * y3;
    if (c === 0 || dist(lastx, lasty, x, y) > arcdist || c === (numtries - 1)) {
      xy = dotransforms(x, y, tmat);
      points.push([xy[0], xy[1]]);
      lastx = x;
      lasty = y;
    }
  }
  return [lastx, lasty];
}

function drawpatharc(sx, sy, ttrx, ttry, txrot, aflag, sflag, ex, ey, tmat) {
  var sweepsteps = 10000;
  var cang, ang, mx, my, xy, rxy, lastx = sx,
    lasty = sy;
  var sa, ea, dir;
  var rx = ttrx;
  var ry = ttry;
  var xrot = (txrot / 180) * Math.PI;
  // *** Arc centre based on https://github.com/canvg/canvg/blob/master/src/canvg.js (13Aug18) ***
  var currpx = Math.cos(xrot) * (sx - ex) / 2.0 + Math.sin(xrot) * (sy - ey) / 2.0;
  var currpy = -Math.sin(xrot) * (sx - ex) / 2.0 + Math.cos(xrot) * (sy - ey) / 2.0;
  var l = Math.pow(currpx, 2) / Math.pow(rx, 2) + Math.pow(currpy, 2) / Math.pow(ry, 2);
  if (l > 1) {
    rx *= Math.sqrt(l);
    ry *= Math.sqrt(l);
  }
  var s = (aflag == sflag ? -1 : 1) * Math.sqrt(
    ((Math.pow(rx, 2) * Math.pow(ry, 2)) - (Math.pow(rx, 2) * Math.pow(currpy, 2)) - (Math.pow(ry, 2) * Math.pow(currpx, 2))) /
    (Math.pow(rx, 2) * Math.pow(currpy, 2) + Math.pow(ry, 2) * Math.pow(currpx, 2))
  );
  if (isNaN(s)) s = 0;
  var cppx = s * rx * currpy / ry;
  var cppy = s * -ry * currpx / rx;
  var cx = (sx + ex) / 2.0 + Math.cos(xrot) * cppx - Math.sin(xrot) * cppy;
  var cy = (sy + ey) / 2.0 + Math.sin(xrot) * cppx + Math.cos(xrot) * cppy;
  var m = function(v) {
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
  }
  var r = function(u, v) {
    return (u[0] * v[0] + u[1] * v[1]) / (m(u) * m(v))
  }
  var a = function(u, v) {
    return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(r(u, v));
  }
  sa = a([1, 0], [(currpx - cppx) / rx, (currpy - cppy) / ry]);
  var u = [(currpx - cppx) / rx, (currpy - cppy) / ry];
  var v = [(-currpx - cppx) / rx, (-currpy - cppy) / ry];
  var sweep = a(u, v);
  if (r(u, v) <= -1) sweep = Math.PI;
  if (r(u, v) >= 1) sweep = 0;
  // *** End of arc centre stuff ***
  if (sflag == 1) dir = 1;
  else dir = -1;
  var astep = sweep / sweepsteps;
  for (cang = 0; cang <= sweepsteps; cang++) {
    ang = sa + (cang * Math.abs(astep) * dir);
    if (ang < 0) ang += (2 * Math.PI);
    if (ang > (2 * Math.PI)) ang -= (2 * Math.PI);
    mx = rx * Math.cos(ang);
    my = ry * Math.sin(ang);
    if (xrot !== 0 && xrot !== (2 * Math.PI)) {
      rxy = rotatepoint(mx, my, xrot);
      mx = rxy[0];
      my = rxy[1];
    }
    mx += cx;
    my += cy;
    if (dist(lastx, lasty, mx, my) > arcdist || cang === 0 || cang === sweepsteps) {
      xy = dotransforms(mx, my, tmat);
      points.push([xy[0], xy[1]]);
      lastx = mx;
      lasty = my;
    }
  }
  return [lastx, lasty];
}

function drawcubicbezier(ax, ay, bx, by, cx, cy, dx, dy, tmat) {
  // a is start and d is end. b and c are control points.
  var c, t, x, y, b0, b1, b2, b3, xy, lastx = ax,
    lasty = ay;
  for (c = 0; c <= 1000; c++) {
    t = c / 1000;
    b0 = Math.pow(1 - t, 3);
    b1 = 3 * t * Math.pow(1 - t, 2);
    b2 = 3 * Math.pow(t, 2) * (1 - t);
    b3 = Math.pow(t, 3);
    x = (b0 * ax) + (b1 * bx) + (b2 * cx) + (b3 * dx);
    y = (b0 * ay) + (b1 * by) + (b2 * cy) + (b3 * dy);
    if (dist(lastx, lasty, x, y) > arcdist || c === 0 || c === 1000) {
      xy = dotransforms(x, y, tmat);
      points.push([xy[0], xy[1]]);
      lastx = x;
      lasty = y;
    }
  }
  return [lastx, lasty];
}

function gettransform(trans) {
  var ttxt, pos, ret, m, tt, tr, ts, t1, t2, t3, t4, t5, t6;
  var mat=[1,0,0,1,0,0];
  var t = [0, 0],
    s = [1, 1],
    r = [0, 0, 0];
  if (trans !== null) {
    pos = trans.search("matrix");
    if (pos != -1) {
      trans = trans.replace(/\s/g, ''); // Remove all white space
      ttxt = trans.substring(pos + 7);
      pos = ttxt.search('\\)');
      ttxt = ttxt.substring(0, pos);
      m = ttxt.split(' ').join(',').split(',');
      if (m.length === 6) {
        t1 = parseFloat(m[0]);
        t2 = parseFloat(m[1]);
        t3 = parseFloat(m[2]);
        t4 = parseFloat(m[3]);
        t5 = parseFloat(m[4]);
        t6 = parseFloat(m[5]);
        if (!isNaN(t1) && t1 !== null && !isNaN(t2) && t2 !== null &&
            !isNaN(t3) && t3 !== null && !isNaN(t4) && t4 !== null &&
            !isNaN(t5) && t5 !== null && !isNaN(t6) && t6 !== null)
          mat = [t1,t2,t3,t4,t5,t6];
      }
    } else // Either matrix or separate operations
    {
      pos = trans.search("translate");
      if (pos != -1) {
        ttxt = trans.substring(pos + 10);
        pos = ttxt.search('\\)');
        ttxt = ttxt.substring(0, pos);
        tt = ttxt.split(' ').join(',').split(',');
        if (tt.length === 2) {
          t1 = parseFloat(tt[0]);
          t2 = parseFloat(tt[1]);
          if (!isNaN(t1) && t1 !== null && !isNaN(t2) && t2 !== null)
            t = [t[0], t[1]];
        }
      }
      pos = trans.search("scale");
      if (pos != -1) {
        ttxt = trans.substring(pos + 6);
        pos = ttxt.search('\\)');
        ttxt = ttxt.substring(0, pos);
        ts = ttxt.split(' ').join(',').split(',');
        if (ts.length === 1) {
          t1 = parseFloat(ts);
          if (!isNaN(t1) && t1 !== null)
            s = [t1, t1];
        }
        if (ts.length === 2) {
          t1 = parseFloat(ts[0]);
          t2 = parseFloat(ts[1]);
          if (!isNaN(t1) && t1 !== null && !isNaN(t2) && t2 !== null)
            s = [t1, t2];
        }
      }
      pos = trans.search("rotate");
      if (pos != -1) {
        ttxt = trans.substring(pos + 7);
        pos = ttxt.search('\\)');
        ttxt = ttxt.substring(0, pos);
        tr = ttxt.split(' ').join(',').split(',');
        if (tr.length === 1) {
          t1 = parseFloat(tr);
          if (!isNaN(t1) && t1 !== null)
            r = [t1, 0, 0];
        }
        if (tr.length === 3) {
          t1 = parseFloat(tr[0]);
          t2 = parseFloat(tr[1]);
          t3 = parseFloat(tr[2]);
          if (!isNaN(t1) && t1 !== null && !isNaN(t2) && t2 !== null && !isNaN(t3) && t3 !== null)
            r = [t1, t2, t3];
        }
      }
      mat=[s[0] * Math.cos(r[0]*torad), s[1] * Math.sin(r[0]*torad), -s[0] * Math.sin(r[0]*torad), s[1] * Math.cos(r[0]*torad),
           (-r[1] * Math.cos(r[0]*torad) + r[2] * Math.sin(r[0]*torad) + r[1]) * s[0] + t[0],
           (-r[1] * Math.sin(r[0]*torad) - r[2] * Math.cos(r[0]*torad) + r[2]) * s[1] + t[1]];
    }
  }
  return mat;
}

function dotransforms(x, y, t) {
  var c, pt;
  pt = applytransform(x, y, t);
  if (transforms.length > 0) {
    for (c = transforms.length - 1; c >= 0; c--) {
      pt = applytransform(pt[0], pt[1], transforms[c]);
    }
  }
  return pt;
}

function applytransform(x, y, t) {
  var px, py;
  px = t[0] * x + t[2] * y + t[4];
  py = t[1] * x + t[3] * y + t[5];
  return [px, py];
}

