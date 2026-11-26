'use strict';

(() => {
  const W = 1040, H = 780, SCALE = 4, TAU = Math.PI * 2;
  const themes = [
    {land:'#b9c598', grass:'#85aa68', lawn:'#9dbc75', curb:'#d5d6c5', road:'#5d6672', water:'#419ba8', deep:'#216e8d', stone:'#c7bdaa', shade:'#657f76', bank:965, tilt:0, mirror:false},
    {land:'#b6c689', grass:'#86ad6e', lawn:'#a5c581', curb:'#e0d7b8', road:'#737779', water:'#569caa', deep:'#326e89', stone:'#daccaf', shade:'#6e8659', bank:1010, tilt:1.13, mirror:true},
    {land:'#d8cb95', grass:'#97b77a', lawn:'#b3c782', curb:'#e8dbb1', road:'#686e78', water:'#3db8ba', deep:'#177a9e', stone:'#ddcda3', shade:'#6c9d80', bank:895, tilt:2.6, mirror:true},
    {land:'#b6ae98', grass:'#99a078', lawn:'#adb48a', curb:'#c8c2b5', road:'#64656b', water:'#528e96', deep:'#315c70', stone:'#bcae9e', shade:'#7b7c6e', bank:958, tilt:3.27, mirror:false},
    {land:'#acc3a2', grass:'#7ba983', lawn:'#97ba8f', curb:'#d1d8c8', road:'#596475', water:'#46a4b2', deep:'#225d7e', stone:'#b6c5ba', shade:'#708f85', bank:939, tilt:4.45, mirror:false}
  ];

  const main = [
    [28, [[-25,306],[104,290],[217,324],[329,316],[430,282],[561,285],[676,330],[785,322],[883,277],[1048,246]]],
    [23, [[77,773],[123,675],[194,601],[252,485],[273,390],[338,313],[419,223],[479,132],[497,-21]]],
    [24, [[-23,563],[103,527],[235,522],[335,579],[477,595],[598,560],[707,489],[794,474],[917,492],[1006,511]]],
    [22, [[795,-25],[757,111],[727,230],[703,322],[666,386],[643,499],[673,578],[749,658],[833,729],[849,808]]],
    [18, [[-15,135],[114,127],[239,153],[357,136],[465,106],[575,95],[661,120],[755,154],[884,146],[1010,110]]]
  ];
  const side = [
    [9, [[-20,411],[88,400],[186,406],[269,392],[375,371]]],
    [11, [[76,132],[86,223],[106,290],[95,389],[109,525]]],
    [10, [[191,-13],[181,79],[204,150],[219,237],[217,323]]],
    [12, [[297,141],[299,220],[315,264],[329,317]]],
    [13, [[355,569],[350,509],[359,451],[411,410],[478,412],[524,456],[511,514],[465,553],[403,560],[355,569]]],
    [11, [[444,292],[482,339],[478,413],[450,461],[433,553],[464,595]]],
    [13, [[559,285],[562,342],[585,407],[576,468],[527,519],[476,595]]],
    [14, [[562,342],[620,344],[676,330],[767,368],[804,418],[794,475]]],
    [12, [[580,94],[605,158],[609,218],[595,269],[603,309]]],
    [12, [[482,132],[541,186],[609,218],[727,230],[844,214],[882,192]]],
    [10, [[748,117],[821,72],[886,66],[939,84]]],
    [12, [[787,322],[832,366],[849,412],[840,480],[806,564],[820,631],[862,670],[956,682]]],
    [11, [[703,380],[758,424],[804,418],[908,375],[966,363]]],
    [10, [[110,527],[102,596],[47,650],[-12,678]]],
    [11, [[-15,725],[130,681],[253,661],[382,707],[479,700],[584,654],[671,579]]],
    [10, [[193,601],[253,661],[288,736],[300,810]]],
    [13, [[360,582],[382,707],[411,788]]],
    [11, [[476,595],[479,700],[515,802]]],
    [12, [[594,560],[582,651],[602,724],[635,804]]],
    [11, [[706,490],[740,548],[806,564],[890,569],[975,590]]],
    [12, [[747,657],[701,715],[684,806]]],
    [9, [[836,732],[892,731],[944,756]]]
  ];
  const variations = [
    [[16, [[252,483],[315,473],[359,451],[435,454]]], [12, [[832,366],[865,304],[883,277],[881,221],[884,146]]]],
    [[12, [[23,56],[99,72],[181,79],[272,45],[350,-15]]], [10, [[257,659],[311,609],[354,570]]], [9, [[109,524],[160,487],[219,461],[260,460]]]],
    [[13, [[794,474],[841,450],[894,430],[950,425]]], [12, [[756,424],[820,424],[875,404],[935,395]]], [10, [[853,675],[883,650],[927,651],[947,654]]]],
    [[16, [[661,120],[703,148],[831,146],[941,171]]], [15, [[644,495],[717,519],[807,535],[928,532]]], [13, [[678,584],[757,612],[830,614],[937,627]]]],
    [[14, [[329,316],[349,246],[395,192],[419,157]]], [13, [[561,285],[574,244],[613,220],[667,177],[662,120]]], [17, [[707,488],[717,429],[766,369],[812,317],[844,214]]]]
  ];

  const rand = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const world = p => ({x:p.x*SCALE,y:p.y*SCALE});
  const length = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

  function projector(theme, index) {
    return (x,y) => {
      const wave = theme.tilt;
      const pos = index === 0 ? {x,y} : {
        x:x + Math.sin(y/133+wave)*25 + Math.sin(x/144-wave)*15,
        y:y + Math.sin(x/144+wave)*28 + Math.cos(y/95-wave)*12
      };
      if (theme.mirror) pos.x = W-pos.x;
      return pos;
    };
  }

  function spline(knots) {
    const result = [];
    for(let i=0;i<knots.length-1;i++){
      const a=knots[Math.max(0,i-1)],b=knots[i],c=knots[i+1],d=knots[Math.min(knots.length-1,i+2)];
      const samples=Math.max(2,Math.ceil(length(b,c)/8));
      for(let j=0;j<samples;j++){
        const t=j/samples,t2=t*t,t3=t2*t;
        const curve=(p,q,r,s)=>.5*((2*q)+(-p+r)*t+(2*p-5*q+4*r-s)*t2+(-p+3*q-3*r+s)*t3);
        result.push({x:curve(a.x,b.x,c.x,d.x),y:curve(a.y,b.y,c.y,d.y)});
      }
    }
    result.push(knots[knots.length-1]);
    return result;
  }

  function roadDistances(roads) {
    const step = 55, columns=Math.ceil(W/step), rows=Math.ceil(H/step);
    const buckets=new Array(columns*rows).fill(null).map(()=>[]);
    for(const road of roads) for(let i=1;i<road.points.length;i++){
      const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dy=b.y-a.y,divisor=dx*dx+dy*dy;
      const reach=72+road.width/2;
      const left=Math.max(0,Math.floor((Math.min(a.x,b.x)-reach)/step));
      const right=Math.min(columns-1,Math.floor((Math.max(a.x,b.x)+reach)/step));
      const top=Math.max(0,Math.floor((Math.min(a.y,b.y)-reach)/step));
      const bottom=Math.min(rows-1,Math.floor((Math.max(a.y,b.y)+reach)/step));
      const segment={x:a.x,y:a.y,dx,dy,divisor,width:road.width/2};
      for(let y=top;y<=bottom;y++) for(let x=left;x<=right;x++) buckets[x+y*columns].push(segment);
    }
    return (x,y)=>{
      const tile=buckets[Math.floor(x/step)+Math.floor(y/step)*columns]||[];
      let nearest=72;
      for(const s of tile){
        const part=Math.max(0,Math.min(1,((x-s.x)*s.dx+(y-s.y)*s.dy)/s.divisor));
        const distance=Math.hypot(x-s.x-part*s.dx,y-s.y-part*s.dy)-s.width;
        if(distance<nearest) nearest=distance;
      }
      return nearest;
    };
  }

  function trace(g, points) {
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for(let i=1;i<points.length;i++) g.lineTo(points[i].x,points[i].y);
  }
  function stroke(g, points, color, width, dash=[]) {
    trace(g,points);g.lineWidth=width;g.setLineDash(dash);g.strokeStyle=color;g.stroke();g.setLineDash([]);
  }
  function shape(g,points,color) {
    trace(g,points);g.closePath();g.fillStyle=color;g.fill();
  }
  function oval(g,x,y,rx,ry,color) {
    g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=color;g.fill();
  }
  function box(g,x,y,w,h,r,color) {
    g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=color;g.fill();
  }

  function generate(index,theme,warp,onLand,roads) {
    const nearRoad=roadDistances(roads),rng=rand(12891+index*2181),plots=[];
    function add(x,y,zone,min=12,spacing=27){
      const p=warp(x,y),distance=nearRoad(p.x,p.y);
      if(p.x<19||p.x>W-19||p.y<19||p.y>H-19||!onLand(p.x,p.y,16)||distance<min) return;
      if(plots.some(a=>Math.hypot(p.x-a.x,p.y-a.y)<spacing)) return;
      const radius=Math.min(zone==='downtown'?42:zone==='park'?33:32,distance-1.2,29+rng()*16);
      if(radius>7) plots.push({...p,zone,r:radius});
    }
    for(let y=37;y<H-17;y+=36)for(let x=31;x<W-25;x+=41){
      const a=x+(rng()-.5)*25,b=y+(rng()-.5)*21;
      if(a>882) add(a,b,'harbor',11,25);
      else if(a>755&&b>478) add(a,b,'industrial',12,29);
      else if(a>500&&b<385||index===4&&a>525&&b<565) add(a,b,'downtown',17,34);
      else if(a>338&&a<535&&b>373&&b<559) add(a,b,'park',9,23);
      else if(a>271&&a<475&&b>260&&b<403||a<248&&b>424&&b<540) add(a,b,'market',10,26);
      else add(a,b,'homes',11,30);
    }
    const plaza=warp(408,403);
    const spawn=roads[0].points.reduce((a,b)=>length(a,plaza)<length(b,plaza)?a:b);
    return {plots,spawn};
  }

  function paint(index,theme,warp,bank,onLand,roads,plots){
    const ground=document.createElement('canvas');
    ground.width=2496;ground.height=1872;
    const g=ground.getContext('2d',{alpha:false}), rng=rand(84091+index*3691);
    g.scale(ground.width/W,ground.height/H);
    g.lineCap='round';g.lineJoin='round';

    const sea=g.createLinearGradient(theme.mirror?W:0,0,theme.mirror?0:W,H);
    sea.addColorStop(0,theme.water);sea.addColorStop(1,theme.deep);
    g.fillStyle=sea;g.fillRect(0,0,W,H);
    for(let i=0;i<1700;i++){
      const x=rng()*W,y=rng()*H;if(onLand(x,y)) continue;
      g.fillStyle=i%3?'#ddfbef29':'#d3ffff70';
      g.fillRect(x,y,2+rng()*13,.4+rng()*.7);
    }
    const shoreline=Array.from({length:Math.ceil(H/9)+1},(_,i)=>({x:bank(i*9),y:i*9}));
    const edge=theme.mirror?W:0, land=[{x:edge,y:0},...shoreline,{x:edge,y:H+9}];
    stroke(g,shoreline,theme.water,18);
    shape(g,land,theme.land);
    stroke(g,shoreline,index===2?'#f9dfa2':'#dbcca4',6);
    stroke(g,shoreline,'#ffffff54',1.6,[7,4]);
    g.save();
    trace(g,land);g.closePath();g.clip();

    // Patches of grass and paving describe city districts before any sprites draw.
    for(const plot of plots){
      const {x,y,r,zone}=plot, offset=(rng()-.5)*11;
      g.save();g.translate(x,y);g.rotate(offset/35);
      if(zone==='homes') box(g,-r*.87,-r*.57,r*1.73,r*1.14,4,theme.grass);
      if(zone==='downtown') box(g,-r*.89,-r*.59,r*1.78,r*1.17,2,theme.stone);
      if(zone==='industrial'||zone==='harbor'){
        box(g,-r*.86,-r*.56,r*1.72,r*1.12,1,'#868d8a');
        for(let j=-2;j<=2;j++) stroke(g,[{x:j*5-2,y:-r*.46},{x:j*5+4,y:-r*.24}],'#eeeecc9b',.8);
      }
      if(zone==='market') box(g,-r*.84,-r*.50,r*1.68,r,3,theme.curb);
      if(zone==='park') oval(g,0,0,r*.85,r*.65,theme.lawn);
      g.restore();
    }
    for(let i=0;i<6400;i++){
      const x=rng()*W,y=rng()*H;
      g.fillStyle=i%3?'#ffffff21':'#3a573c26';
      g.fillRect(x,y,.65+rng()*1.7,.55+rng()*.9);
    }

    const garden=spline([[351,452],[371,408],[418,391],[484,419],[512,464],[488,514],[430,534],[380,513],[351,452]].map(p=>warp(...p)));
    shape(g,garden,theme.grass);
    stroke(g,garden,theme.shade,1);
    stroke(g,spline([[367,457],[406,440],[448,448],[493,480]].map(p=>warp(...p))),theme.curb,6);
    stroke(g,spline([[407,414],[418,436],[437,471],[463,513]].map(p=>warp(...p))),theme.curb,4.5);
    const pool=warp(440,474);
    oval(g,pool.x,pool.y,23,14,theme.curb);
    oval(g,pool.x,pool.y,20,11,'#6cbac0');
    oval(g,pool.x-4,pool.y-2,10,3,'#d5f5d589');
    const plaza=warp(389,353);
    oval(g,plaza.x,plaza.y,29,19,theme.stone);
    for(let j=0;j<4;j++){
      g.beginPath();g.ellipse(plaza.x,plaza.y,7+j*6,4+j*4,0,0,TAU);
      g.strokeStyle='#faf7d9a8';g.lineWidth=.65;g.stroke();
    }
    oval(g,plaza.x,plaza.y,6,4,theme.water);
    const court=warp(323,637);
    box(g,court.x-25,court.y-13,50,26,3,'#657e6e');
    box(g,court.x-22,court.y-10,44,20,1,'#80ab83');
    g.strokeStyle='#f4f2ce';g.lineWidth=.7;g.strokeRect(court.x-21,court.y-9,42,18);
    stroke(g,[{x:court.x,y:court.y-9},{x:court.x,y:court.y+9}],'#f4f2ce',.7);
    g.beginPath();g.arc(court.x,court.y,4,0,TAU);g.stroke();

    const tracks=spline([[558,806],[551,725],[538,674],[512,638],[431,618],[348,605],[244,619],[151,686],[79,739],[-14,771]].map(p=>warp(...p)));
    stroke(g,tracks,'#7a796743',5.3);stroke(g,tracks,'#7b736fba',3.1,[.7,2]);stroke(g,tracks,'#ad9d8c',1.1);

    // Layered curbs keep junctions continuous.
    for(const road of roads) stroke(g,road.points,'#3e4d4b34',road.width+7);
    for(const road of roads) stroke(g,road.points,theme.curb,road.width+5.7);
    for(const road of roads) stroke(g,road.points,'#768381',road.width+1.9);
    for(const road of roads) stroke(g,road.points,theme.road,road.width);
    for(const road of roads){
      if(road.width>17){
        stroke(g,road.points,'#858d93',road.width*.83);
        stroke(g,road.points,theme.road,road.width*.79);
      }
      stroke(g,road.points,road.width>=17?'#f5d590d0':'#e0e6e3c0',road.width>=17?.8:.48,road.width>=17?[4.5,5]:[2,5]);
      if (road.width<12) continue;
      for(let i=5;i<road.points.length-6;i+=13){
        const a=road.points[i],b=road.points[i+1],d=length(a,b);
        const nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;
        g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));
        g.globalAlpha=.82;
        for(const side of [-1,1]){
          g.strokeStyle='#e4e9de';g.lineWidth=.6;
          g.beginPath();g.moveTo(-3,side*road.width*.29);g.lineTo(1,side*road.width*.29);g.lineTo(-.4,side*road.width*.21);g.stroke();
        }
        g.restore();
        if(i%3===0){
          for(let j=-2;j<=2;j++){
            const p={x:a.x+nx*j*road.width*.152,y:a.y+ny*j*road.width*.152};
            stroke(g,[{x:p.x-(b.x-a.x)/d*1.3,y:p.y-(b.y-a.y)/d*1.3},{x:p.x+(b.x-a.x)/d*1.3,y:p.y+(b.y-a.y)/d*1.3}],'#e8e4d9df',1.05);
          }
        }
      }
    }
    g.restore();

    // Breakwaters and dock roofs extend past the shoreline.
    for(let i=0;i<4;i++){
      const y = 409+i*31+(index===2?-28:0), x=bank(y), sign=theme.mirror?-1:1;
      box(g,sign>0?x-10:x-29,y,39,9,1,'#ab9a83');
      stroke(g,[{x:x-sign*10,y:y+1},{x:x+sign*29,y:y+1}],'#e2d5b3',.9);
      if(i%2===0)box(g,sign>0?x+12:x-25,y+12,13,4,1,'#f1e9c3');
    }
    for(let i=0;i<3;i++){
      const y=570+i*12,x=bank(y)+(theme.mirror?-1:1)*(25+i*7);
      oval(g,x,y,8,1.9,'#174e6561');
      box(g,x-5,y-2,9,3.1,1,i%2?'#e99d63':'#fbebbd');
    }
    return ground;
  }

  function create(index=0){
    index = Math.max(0,Math.min(themes.length-1,Math.floor(index)||0));
    const theme=themes[index],warp=projector(theme,index);
    const toShore=y=>theme.bank+Math.sin(y/68+theme.tilt)*19+Math.cos(y/51-theme.tilt)*8-Math.exp(-(((y-427)/104)**2))*35;
    const bank=y=>theme.mirror?W-toShore(y):toShore(y);
    const onLand=(x,y,margin=0)=>theme.mirror ? x>=bank(y)+margin : x<=bank(y)-margin;
    const zoneRoads = side.filter((_,i)=>index===0 || i%8!==index);
    const roads=[...main,...zoneRoads,...variations[index]].map(([width,coords])=>({width,points:spline(coords.map(p=>warp(...p)))}));
    const {plots,spawn}=generate(index,theme,warp,onLand,roads);
    const ground=paint(index,theme,warp,bank,onLand,roads,plots);
    return {
      w:W*SCALE,h:H*SCALE,spawn:world(spawn),
      plots:plots.map(p=>({...world(p),zone:p.zone,r:p.r*SCALE})),
      roads:roads.map(road=>({width:road.width*SCALE,points:road.points.map(world)})),
      ground,isLand(x,y){return onLand(x/SCALE,y/SCALE);}
    };
  }
  window.SGCityDistrict = {create};
})();
