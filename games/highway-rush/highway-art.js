(() => {
  'use strict';

  const PI = Math.PI;
  const TAU = PI * 2;
  const palettes = [
    {sky:['#423b78','#c5719a','#fb947d','#ffe1a0'],sun:'#fff2b7',cloud:'#ffc0a3',cloudShade:'#82547c',mount:['#80719c','#655878','#46405d'],ground:['#96815c','#352e39'],city:['#595273','#333953','#222a42'],window:['#ffc57a','#79bdee'],tree:['#738341','#344330','#252937']},
    {sky:['#385873','#7495a1','#e4aa78','#ffe7b1'],sun:'#fff0c7',cloud:'#f8d6a5',cloudShade:'#a28180',mount:['#bf9083','#b17967','#8f5a48'],ground:['#b6815a','#60463d'],city:['#ac7662','#7e5246','#644741'],window:['#ffd482','#c6ae8a'],tree:['#b5a164','#6b7649','#3d5143']},
    {sky:['#0b1435','#23254e','#4b3964','#c16d88'],sun:'#cdd8f9',cloud:'#655a93',cloudShade:'#241f4c',mount:['#544e75','#392e56','#292240'],ground:['#494058','#151527'],city:['#2f3865','#252747','#141b36'],window:['#ffc56c','#72d8f4'],tree:['#4b657e','#333d59','#2a2840']},
    {sky:['#226eac','#73b8db','#b6e5e8','#fff0cd'],sun:'#fff7d5',cloud:'#fff1d5',cloudShade:'#7caac1',mount:['#99bfd0','#71a0ae','#4b8594'],ground:['#c1a983','#507d68'],city:['#819bad','#61816e','#41676b'],window:['#ffd99c','#b7eafa'],tree:['#779c4e','#496d54','#305558']},
    {sky:['#314f7b','#7494b6','#b1c2d1','#f8daca'],sun:'#ffe8c6',cloud:'#f9e6db',cloudShade:'#899ab8',mount:['#8d9db3','#626f8f','#414f6b'],ground:['#535b5e','#2d423e'],city:['#7c8798','#535d75','#3f4d63'],window:['#fdcb92','#94b8d3'],tree:['#729084','#3e7066','#254c4b']}
  ];

  function randomFrom(seed) {
    return () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function gradient(ctx, x0, y0, x1, y1, colors) {
    const g = ctx.createLinearGradient(x0,y0,x1,y1);
    colors.forEach((color,i) => g.addColorStop(i / (colors.length-1),color));
    return g;
  }

  function fill(ctx, color) {
    ctx.fillStyle = color;
    ctx.fill();
  }

  function ellipse(ctx, x,y,rx,ry,color,angle=0) {
    ctx.beginPath();
    ctx.ellipse(x,y,rx,ry,angle,0,TAU);
    fill(ctx,color);
  }

  function polygon(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(points[0][0],points[0][1]);
    for (let i=1; i<points.length; i++) ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath();
    fill(ctx,color);
  }

  function line(ctx, points, color, width=1) {
    ctx.beginPath();
    ctx.moveTo(points[0][0],points[0][1]);
    for (let i=1; i<points.length; i++) ctx.lineTo(points[i][0],points[i][1]);
    ctx.strokeStyle=color;
    ctx.lineWidth=width;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.stroke();
  }

  function rounded(ctx,x,y,width,height,radius,color) {
    ctx.beginPath();
    ctx.roundRect(x,y,width,height,radius);
    fill(ctx,color);
  }

  function cloud(ctx,x,y,w,h,p,random) {
    ctx.save();
    ctx.globalAlpha=.5;
    for(let i=0;i<10;i++){
      const q=i/9;
      const cx=x+q*w, cy=y+(random()-.5)*h+Math.sin(q*PI)*-h*.44;
      const rx=(w*.055+random()*w*.11)*(.58+.42*Math.sin(q*PI));
      ellipse(ctx,cx,cy,rx,h*(.15+random()*.16),p.cloudShade,-.12);
      ellipse(ctx,cx+3,cy-2,rx*.9,h*(.095+random()*.12),p.cloud,-.12);
    }
    ctx.restore();
  }

  function ridgeline(ctx,w,horizon,p,index,shape,random) {
    const high=(index+2)*horizon*.08;
    const ridge=[];
    const n=shape===1?20:26;
    for(let i=0;i<=n;i++){
      const x=i*w/n;
      const peak=Math.abs(Math.sin(i*.77+index))*.8+random()*.28;
      const edge=shape===4?.72+.48*Math.abs((i-n/2)/(n/2)):.75+.3*Math.cos(i*.45);
      const f=shape===1?Math.floor(peak*3)/2:peak;
      ridge.push([x,horizon-high*(.21+f)*edge+horizon*index*.012]);
    }
    polygon(ctx,[[0,horizon+4],...ridge,[w,horizon+4]],p.mount[index]);
    if(shape===4){
      for(let i=1;i<ridge.length-1;i++){
        const [x,y]=ridge[i], [lx,ly]=ridge[i-1], [rx,ry]=ridge[i+1];
        if(y+horizon*.026<Math.min(ly,ry)){
          const d=Math.min(ly-y,ry-y);
          polygon(ctx,[[x,y],[x+(rx-x)*.41,y+d*.51],[x+(rx-x)*.13,y+d*.58],[x-(x-lx)*.13,y+d*.38],[x-(x-lx)*.38,y+d*.57]],index?'#d7e2ec':'#e5e9e8');
          polygon(ctx,[[x,y],[x+(rx-x)*.41,y+d*.51],[x+(rx-x)*.13,y+d*.58]],'#9eb3c9');
        }
      }
    }
  }

  function skyline(ctx,w,y,p,night,random,coast) {
    for(let layer=0;layer<2;layer++){
      let x=-6;
      while(x<w){
        const width=(.022+random()*.052)*w, height=(.024+random()*(coast?.1:.24))*y;
        const base=y+layer*4;
        if((x<w*.39||x>w*.59)&&(!coast||x>w*.57)){
          const top=base-height, side=Math.min(width*.21,9);
          ctx.fillStyle=gradient(ctx,x,top,x+width,top,[p.city[layer],p.city[layer+1]]);
          ctx.fillRect(x,top,width,height);
          polygon(ctx,[[x+width,top],[x+width+side,top+side*.6],[x+width+side,base],[x+width,base]],p.city[2]);
          line(ctx,[[x,top+.5],[x+width,top+.5]],night?'#8488bf':'#e6a497',.8);
          if(random()>.58){
            ctx.fillStyle=p.city[layer+1];
            ctx.fillRect(x+width*.18,top-height*.1,width*.64,height*.11);
            if(random()>.75){
              line(ctx,[[x+width*.53,top-height*.1],[x+width*.53,top-height*.22]],p.city[1]);
              ellipse(ctx,x+width*.53,top-height*.22,1,1,night?'#f9989f':'#f4a682');
            }
          }
          const rows=Math.floor(height/(layer?6:4)), columns=Math.max(2,Math.floor(width/6));
          for(let r=0;r<rows-1;r++){
            for(let c=0;c<columns;c++){
              if(random()<(night?.26:.4))continue;
              ctx.globalAlpha=night?.4+random()*.47:.23+random()*.36;
              ctx.fillStyle=p.window[(c+r)%2];
              ctx.fillRect(x+width*(c+.27)/columns,top+height*(r+.5)/rows,width/columns*.39,night?1.8:1.3);
            }
          }
          ctx.globalAlpha=1;
        }
        x+=width+3+random()*4;
      }
    }
  }

  function palm(ctx,x,y,size,tilt,p,random) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(size,size);
    const top=[tilt,-90];
    ctx.beginPath();
    ctx.moveTo(-4,1);
    ctx.bezierCurveTo(-1,-25,tilt*.45-7,-67,tilt-2,-90);
    ctx.lineTo(tilt+4,-91);
    ctx.bezierCurveTo(tilt*.7+7,-65,4,-25,4,1);
    ctx.closePath();
    fill(ctx,gradient(ctx,-6,-91,14,-91,['#4b3440','#856655','#382c36']));
    for(let i=1;i<8;i++){
      const py=i*-10;
      const px=tilt*(i/9)**1.5;
      line(ctx,[[px-2,py],[px+2,py-1]],'#ad826667',1.1);
    }
    ctx.translate(...top);
    const angles=[-2.99,-2.67,-2.28,-1.8,-1.2,-.79,-.34,.18,.57,1.09,1.64,2.25,2.72];
    angles.forEach((a,i)=>{
      const len=23+random()*27;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-2,1);
      ctx.bezierCurveTo(len*.22,-12,len*.66,-15,len,-1);
      ctx.quadraticCurveTo(len*.66,-6,len*.54,1);
      ctx.lineTo(len*.44,-2);
      ctx.quadraticCurveTo(len*.19,4,-2,1);
      fill(ctx,gradient(ctx,0,-9,0,3,[p.tree[i%2],p.tree[2]]));
      line(ctx,[[0,0],[len*.35,-5],[len*.64,-7],[len*.9,-4]],p.tree[0],.55);
      ctx.restore();
    });
    ellipse(ctx,1,0,5.4,3.3,p.tree[2]);
    ctx.restore();
  }

  function pine(ctx,x,y,size,p) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(size,size);
    line(ctx,[[0,-1],[0,-41]],'#574840',3);
    for(let i=0;i<5;i++){
      const top=-63+i*7, width=5+i*2.6;
      polygon(ctx,[[0,top],[-width,top+22],[-width*.48,top+20],[-width*.7,top+24],[0,top+23],[width*.79,top+24],[width*.62,top+20],[width,top+22]],p.tree[i%2+1]);
      polygon(ctx,[[0,top],[1,top+17],[-width*.9,top+21],[-width*.67,top+17]],p.tree[0]);
    }
    ctx.restore();
  }

  function cactus(ctx,x,y,size,p) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(size,size);
    const segments=[[[0,0],[0,-57]],[[-1,-17],[-13,-17],[-18,-23],[-18,-37]],[[1,-25],[12,-25],[17,-32],[17,-43]]];
    segments.forEach(points=>{
      line(ctx,points,p.tree[2],9);
      line(ctx,points.map(([px,py])=>[px-1.3,py-1]),p.tree[1],5);
      line(ctx,points.map(([px,py])=>[px-2.2,py-1]),p.tree[0],.8);
    });
    ctx.restore();
  }

  function backdrop(ctx,w,h,environment=0,horizonY=h*.38) {
    const i = Number.isInteger(environment) && palettes[environment] ? environment : 0;
    const p=palettes[i], horizon=Math.max(20,Math.min(h-20,horizonY)), random=randomFrom(1327+i*137);
    ctx.save();
    ctx.fillStyle=gradient(ctx,0,0,0,horizon,p.sky);
    ctx.fillRect(0,0,w,horizon+4);
    const sx=w*(i===1?.29:i===2?.23:.72), sy=horizon*(i===4?.37:i===2?.28:.61), radius=Math.min(w,horizon)*(i===2?.055:.135);
    const halo=ctx.createRadialGradient(sx,sy,radius*.08,sx,sy,radius*2.8);
    halo.addColorStop(0,p.sun+'b8');
    halo.addColorStop(.25,p.sun+'6a');
    halo.addColorStop(1,p.sun+'00');
    ellipse(ctx,sx,sy,radius*2.8,radius*2.8,halo);
    ellipse(ctx,sx,sy,radius,radius,p.sun);
    for(let n=0;n<(i===2?4:7);n++){
      const x=random()*w-w*.18,y=(.13+random()*.63)*horizon;
      cloud(ctx,x,y,(.13+random()*.38)*w,(.045+random()*.115)*horizon,p,random);
    }
    if(i===2){
      for(let n=0;n<43;n++){
        const x=random()*w,y=random()*horizon*.69;
        ellipse(ctx,x,y,n%7?.63:1.14,n%7?.63:1.14,n%2?'#cdd8ff7d':'#ffd7e488');
      }
      ellipse(ctx,sx+radius*.41,sy-radius*.27,radius*.83,radius*.83,'#1d2348');
    }
    ctx.fillStyle=gradient(ctx,0,horizon,0,h,p.ground);
    ctx.fillRect(0,horizon,w,h-horizon);
    if(i===3){
      ctx.fillStyle=gradient(ctx,0,horizon*.89,0,h*.73,['#7fbcc5','#389db0','#246f85']);
      ctx.fillRect(0,horizon*.89,w,h*.73-horizon*.89);
      polygon(ctx,[[0,h*.66],[w*.46,horizon],[w*.38,h],[0,h]],'#748b68');
      line(ctx,[[0,h*.64],[w*.26,h*.50],[w*.46,horizon]],'#fff6d1b0',2.1);
      for(let n=0;n<45;n++){
        const x=random()*w*.52,y=horizon+random()*(h*.30);
        if(y>h*.64-(x/w)*h*.34)continue;
        line(ctx,[[x,y],[x+3+random()*15,y-.3]],n%2?'#d9efe897':'#24708489',.6+random());
      }
    }
    for(let layer=0;layer<3;layer++)ridgeline(ctx,w,horizon,p,layer,i,random);
    if(i===0||i===2||i===3)skyline(ctx,w,horizon+1,p,i===2,random,i===3);
    for(let y=horizon+6;y<h;y+=6){
      const t=(y-horizon)/(h-horizon);
      ctx.globalAlpha=.12+t*.31;
      for(let j=0;j<3;j++){
        const x=random()*w, s=(2+random()*11)*Math.max(.21,t);
        line(ctx,[[x,y],[x+s,y]],j%2?p.ground[0]:p.ground[1],.65+t);
      }
    }
    ctx.globalAlpha=1;
    const flora=i===4?pine:i===1?cactus:palm;
    const oakList=[
      [.10,.07,.24],[.88,.10,.27],[.77,.04,.16],[.19,.137,.40],
      [.98,.31,.90],[.039,.272,.81],[.12,.198,.53],[.91,.18,.55]
    ].sort((a,b)=>a[1]-b[1]);
    for(const [u,v,scale] of oakList){
      const x=w*u,y=horizon+(h-horizon)*v,size=scale*Math.min(w/420,h/610);
      if(flora===palm)flora(ctx,x,y,size,(u<.5?1:-1)*(9+random()*9),p,random);
      else flora(ctx,x,y,size,p);
    }
    ctx.restore();
  }

  const bodies={
    sport:{width:100,base:42,roof:83,cabin:34,back:34,taper:5,vent:0},
    muscle:{width:106,base:46,roof:88,cabin:36,back:41,taper:5,vent:1},
    super:{width:108,base:35,roof:69,cabin:26,back:34,taper:11,vent:2},
    suv:{width:98,base:49,roof:106,cabin:39,back:44,taper:3,vent:3},
    sedan:{width:89,base:42,roof:87,cabin:33,back:34,taper:8,vent:0},
    truck:{width:114,base:53,roof:134,cabin:50,back:49,taper:2,vent:4}
  };

  function tires(ctx,w,base,tall) {
    for(const s of [-1,1]){
      const cx=s*(w-9);
      rounded(ctx,cx-10,-base*.49,20,base*.57+4,5,gradient(ctx,cx-9,0,cx+9,0,['#0c101a','#292936','#101421']));
      rounded(ctx,cx-7,-base*.37,14,base*.39+1,4,'#141620');
      for(let j=0;j<3;j++){
        const x=cx-4+j*4;
        line(ctx,[[x,-base*.24],[x,-1]],'#2b2c38',.8);
      }
      if(tall) ellipse(ctx,cx,-base*.32,4,6,'#495561');
    }
  }

  function truckTop(ctx,dim,paint) {
    const {roof,back}=dim;
    rounded(ctx,-back,-roof,back*2,roof-23,5,'#0f1724');
    rounded(ctx,-back+2,-roof+2,back*2-4,roof-27,4,paint);
    rounded(ctx,-back+2,-roof+2,back*2-4,roof-27,4,gradient(ctx,0,-roof,0,-20,['#fbf4e45a','#fff0f014','#10172480']));
    const y0=-roof+9,y1=-39;
    for (const s of [-1,1]){
      polygon(ctx,[[s*3,y0],[s*(back-7),y0],[s*(back-7),y1],[s*3,y1]],gradient(ctx,0,y0,0,y1,['#fcf4ed64','#ddd9ee18','#11152345']));
      line(ctx,[[s*1,y0],[s*1,y1]],'#23213fbb',2);
      line(ctx,[[s*5,y0+2],[s*5,y1-3]],'#ffffff69',1.2);
      line(ctx,[[s*14,y1-9],[s*29,y1-9]],'#242330',2.6);
      line(ctx,[[s*15,y1-9.6],[s*27,y1-9.6]],'#cdd9de',1);
      rounded(ctx,s*(back-8)-3,-roof+4,6,4,1,'#ffb368');
    }
  }

  function carTop(ctx,d,paint,player) {
    const {width,base,roof,cabin,vent}=d;
    const w=width/2, shelf=base+15;
    const cap=vent===3?cabin-1:cabin-7;
    ctx.beginPath();
    ctx.moveTo(-w+4,-base+1);
    ctx.bezierCurveTo(-w+7,-base-9,-cabin-13,-shelf+1,-cabin-9,-shelf-5);
    ctx.bezierCurveTo(-cap-3,-roof+6,-cap-4,-roof, -cap+3,-roof);
    ctx.quadraticCurveTo(0,-roof-4,cap-3,-roof);
    ctx.bezierCurveTo(cap+4,-roof,cap+3,-roof+6,cabin+9,-shelf-5);
    ctx.bezierCurveTo(cabin+13,-shelf+1,w-7,-base-9,w-4,-base+1);
    ctx.closePath();
    fill(ctx,paint);
    fill(ctx,gradient(ctx,0,-roof,0,-base,['#fff6ed88','#ffe6cb38','#12182f86']));
    if(player){
      ctx.save();
      ctx.clip();
      ctx.fillStyle='#ffe9d2e8';
      ctx.fillRect(-9,-roof-4,6,roof-base+8);
      ctx.fillRect(3,-roof-4,6,roof-base+8);
      ctx.restore();
    }
    const y0=-roof+9,y1=-base-9;
    polygon(ctx,[[-cap,y0],[-cabin-4,y1],[-cabin+2,y1+4],[cabin-2,y1+4],[cabin+4,y1],[cap,y0],[cap-6,y0-2],[-cap+6,y0-2]],'#141a27');
    polygon(ctx,[[-cap+2,y0],[-cabin-1,y1],[-cabin+4,y1+1],[cabin-4,y1+1],[cabin+1,y1],[cap-2,y0]],gradient(ctx,0,y0,0,y1+1,['#7190a1','#283951','#121c2d']));
    polygon(ctx,[[-cap+2,y0],[cap-2,y0],[cap,y0+5],[-cabin+3,y0+9]],'#d2d4e043');
    line(ctx,[[-cabin+5,y1-1],[cabin-5,y1-1]],'#afc9e042',1);
    if (vent!==3) {
      for (const s of [-1,1]){
        rounded(ctx,s*(w-3)-6,-base-17,12,8,3,paint);
        line(ctx,[[s*(w-7),-base-15],[s*(w+1),-base-15]],'#fdfafa60',1.15);
        line(ctx,[[s*(cabin+4),y1+5],[s*(w-6),-base-4]],'#f9f0d760',1.3);
      }
    }
  }

  function rear(ctx,d,paint,player) {
    const {width,base,taper,back,vent}=d,w=width/2;
    ctx.beginPath();
    ctx.moveTo(-w+13,-base-5);
    ctx.bezierCurveTo(-w+2,-base-1,-w-2,-base+1,-w+1,-base+11);
    ctx.lineTo(-w+3,-12);
    ctx.quadraticCurveTo(-w+taper,-6,-w+taper+5,-6);
    ctx.quadraticCurveTo(0,-4,w-taper-5,-6);
    ctx.quadraticCurveTo(w-taper,-6,w-3,-12);
    ctx.lineTo(w-1,-base+11);
    ctx.bezierCurveTo(w+2,-base+1,w-2,-base-1,w-13,-base-5);
    ctx.closePath();
    ctx.strokeStyle='#151927';
    ctx.lineWidth=3;
    ctx.stroke();
    fill(ctx,paint);
    fill(ctx,gradient(ctx,0,-base-5,0,-4,['#fff0d968','#f3e6e006','#16182da2','#0e142877']));
    if(player&&vent!==4){
      ctx.save();
      ctx.clip();
      ctx.fillStyle='#ffecdadd';
      ctx.fillRect(-9,-base-7,6,base*.81);
      ctx.fillRect(3,-base-7,6,base*.81);
      ctx.restore();
    }
    line(ctx,[[-w+15,-base-3],[-w+3,-base+1],[w-3,-base+1],[w-15,-base-3]],'#fff8f38a',1.25);
    const lampY=-base+13, unit=Math.min(25,back*.66);
    for(const s of [-1,1]){
      ctx.save();
      ctx.scale(s,1);
      const x=w-9;
      if(vent===3||vent===4) {
        rounded(ctx,x-10,lampY-4,11,17,3,'#3d162b');
        rounded(ctx,x-8,lampY-2,7,12,2,gradient(ctx,0,lampY-3,0,lampY+13,['#ffb08a','#e3213b','#7c1434']));
        rounded(ctx,x-7,lampY+6,5,2,1,'#ffd9a5');
      } else if(vent===1) {
        rounded(ctx,x-unit-1,lampY-6,unit+3,13,3,'#350d24');
        for(let j=0;j<3;j++) rounded(ctx,x-unit+j*(unit/3.3),lampY-4,unit/4.4,8,2,gradient(ctx,0,lampY-4,0,lampY+4,['#ffe3ad','#ff5f55','#961128']));
      } else {
        polygon(ctx,[[x+1,lampY-7],[x-unit,lampY-3],[x-unit+3,lampY+4],[x-4,lampY+6]],'#340e26');
        polygon(ctx,[[x,lampY-5],[x-unit+2,lampY-2],[x-unit+4,lampY+3],[x-4,lampY+4]],gradient(ctx,0,lampY-5,0,lampY+5,['#ffd795','#ff6469','#a51d4c']));
        line(ctx,[[x-2,lampY-3],[x-6,lampY],[x-unit+4,lampY-1]],'#ffe6b5',1.3);
      }
      line(ctx,[[x-13,-13],[x-1,-13]],'#dd7276',1.6);
      ctx.restore();
    }
    rounded(ctx,-16,-18,32,9,3,'#141725');
    rounded(ctx,-11,-17,22,6,1,gradient(ctx,0,-17,0,-12,['#dce7f1','#9aa8c4']));
    for(let t=-6;t<=5;t+=3) line(ctx,[[t,-15],[t,-13]],'#415067',.9);
    ellipse(ctx,0,lampY-1,4,1.8,'#cfd7de');
    line(ctx,[[-w+9,-10],[-w+taper+8,-7],[w-taper-8,-7],[w-9,-10]],'#0b1321',2.8);
    if(vent!==4){
      for(const s of [-1,1]){
        ellipse(ctx,s*(w-18),-7,4.5,2.6,'#828393');
        ellipse(ctx,s*(w-18),-7,3,1.55,'#111624');
      }
    }
    if(vent===2){
      rounded(ctx,-w+9,-base-11,width-18,3,1,paint);
      line(ctx,[[-w+12,-base-10],[w-12,-base-10]],'#f7eeca',.8);
      for(const s of [-1,1]) line(ctx,[[s*(w-20),-base-8],[s*(w-20),-base-1]],'#252439',1.9);
    }
  }

  const sprites=new Map();

  function makeCar(paint,body,player) {
    const copy=document.createElement('canvas'),d=bodies[body]||bodies.sport;
    copy.width=244;
    copy.height=300;
    const ctx=copy.getContext('2d');
    ctx.scale(2,2);
    ctx.translate(61,145);
    tires(ctx,d.width/2,d.base,d.vent>=3);
    if(d.vent===4) truckTop(ctx,d,paint);
    else carTop(ctx,d,paint,player);
    rear(ctx,d,paint,player);
    return copy;
  }

  function drawCar(ctx,x,y,scale,paint='#db3447',body='sport',player=false) {
    if(!(scale>0))return;
    const key=[paint,body,player].join(':');
    if(!sprites.has(key)){
      if(sprites.size>=100)sprites.delete(sprites.keys().next().value);
      sprites.set(key,makeCar(paint,body,player));
    }
    const w=(bodies[body]||bodies.sport).width;
    ellipse(ctx,x,y+scale*.8,w*scale*.49,Math.max(.4,scale*5),'#15152b84');
    ctx.drawImage(sprites.get(key),x-scale*61,y-scale*145,122*scale,150*scale);
  }

  function coin(ctx,x,y,radius,phase=0) {
    if(!(radius>0))return;
    const rx=Math.max(radius*.2,radius*Math.abs(Math.cos(phase)));
    ctx.save();
    ctx.translate(x,y);
    const glow=ctx.createRadialGradient(0,0,1e-4,0,0,radius*1.62);
    glow.addColorStop(0,'#ffd26971');
    glow.addColorStop(.62,'#ffc54822');
    glow.addColorStop(1,'#ffb85a00');
    ellipse(ctx,0,0,radius*1.62,radius*1.62,glow);
    ellipse(ctx,rx*.2,radius*.07,rx*1.06,radius,'#c97516');
    ellipse(ctx,0,0,rx,radius,gradient(ctx,0,-radius,0,radius,['#fffb9a','#ffd253','#ef982e']));
    ellipse(ctx,0,0,rx*.75,radius*.76,'#ed9e26');
    ellipse(ctx,0,0,rx*.66,radius*.67,gradient(ctx,0,-radius,0,radius,['#ffde74','#f9b83c','#e48e14']));
    const star=[];
    for(let i=0;i<10;i++){
      const a=-PI/2+i*PI/5, k=i%2?.24:.51;
      star.push([Math.cos(a)*rx*k,Math.sin(a)*radius*k]);
    }
    polygon(ctx,star,'#fff2a1');
    ctx.restore();
  }

  window.SGHighwayArt={backdrop,drawCar,coin};
})();
