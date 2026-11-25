(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const restaurantThemes = [
    { accent:'#df2729', shade:'#741331', frame:'#7c2333', sky:['#75ceee','#d9f6ee'], skyline:'#9acbd2', lamp:'#ffbf62', plant:'#59a572' },
    { accent:'#138e9c', shade:'#123d61', frame:'#29546a', sky:['#ff9a77','#fff0c7'], skyline:'#d49087', lamp:'#fecd81', plant:'#539f82' },
    { accent:'#a43367', shade:'#522446', frame:'#563652', sky:['#524e87','#ed9892'], skyline:'#a06a8b', lamp:'#ffd28b', plant:'#6a947b' },
    { accent:'#bd5127', shade:'#75432a', frame:'#75402c', sky:['#8bcbdc','#fff0c5'], skyline:'#c9b985', lamp:'#ffb869', plant:'#67965b' },
  ];
  const people = [
    { skin:['#ffd1a2','#cb744b'], hair:['#7d4332','#341c29'], shirt:['#59b9f0','#2664a6'], eyes:'#452831', style:0 },
    { skin:['#ce8963','#9b4e36'], hair:['#302638','#161a30'], shirt:['#75d19f','#23826e'], eyes:'#2f2130', style:1 },
    { skin:['#ffd8ab','#df8c64'], hair:['#7c5141','#35233d'], shirt:['#fc9acb','#ba3d76'], eyes:'#4f3541', style:2 },
    { skin:['#ad6c50','#71432f'], hair:['#402631','#211823'], shirt:['#fbbb84','#c55c44'], eyes:'#291923', style:3 },
    { skin:['#f2be94','#b47158'], hair:['#db8a43','#783d32'], shirt:['#bd9ce8','#7156ad'], eyes:'#4b2c39', style:1 },
    { skin:['#edaa66','#b76843'], hair:['#304052','#1e2a40'], shirt:['#e27b68','#a53b55'], eyes:'#372936', style:2 },
  ];

  function gradient(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([position, color]) => g.addColorStop(position, color));
    return g;
  }

  function vertical(ctx, y0, y1, ...colors) {
    return gradient(ctx, 0, y0, 0, y1, colors.map((color, index) => [index / (colors.length - 1), color]));
  }

  function radial(ctx, x, y, r, inside, outside) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inside);
    g.addColorStop(1, outside);
    return g;
  }

  function oval(ctx, x, y, rx, ry, color, rotation = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function rounded(ctx, x, y, w, h, radius, color) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function path(ctx, draw, fill, stroke, width = 1) {
    ctx.beginPath();
    draw(ctx);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  function poly(ctx, points, fill, stroke, width) {
    path(ctx, p => {
      p.moveTo(...points[0]);
      for (const point of points.slice(1)) p.lineTo(...point);
      p.closePath();
    }, fill, stroke, width);
  }

  function counterTexture(ctx) {
    ctx.fillStyle = vertical(ctx, 454, 720, '#e1d8cb', '#a7adad', '#4b5a68');
    ctx.fillRect(0, 454, 1280, 266);
    ctx.fillStyle = vertical(ctx, 465, 661, '#91a2a5', '#f0edde', '#8f9da1');
    ctx.fillRect(0, 478, 1280, 213);
    for (let i = 0; i < 86; i++) {
      const y = 478 + (i * 29) % 213;
      const x = (i * 131) % 1297;
      ctx.fillStyle = i % 3 === 0 ? '#fcfff854' : '#43525a1e';
      ctx.fillRect(x, y, 23 + (i * 73) % 385, 1);
    }
    ctx.fillStyle = vertical(ctx, 686, 719, '#5a666d', '#e0dfd6', '#819099');
    ctx.fillRect(0, 686, 1280, 34);
    ctx.fillStyle = '#f7fffa90';
    ctx.fillRect(0, 689, 1280, 2);
  }

  function kitchenWindow(ctx, theme) {
    const left = 560;
    const right = 1270;
    rounded(ctx, left - 13, 41, 730, 338, 28, '#3b2436');
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(left, 50, right - left, 305, 22);
    ctx.clip();
    ctx.fillStyle = vertical(ctx, 52, 355, ...theme.sky);
    ctx.fillRect(left, 48, 740, 318);
    for (const [x, y, w] of [[620,119,62],[875,124,86],[1156,101,68]]) {
      oval(ctx, x, y, w, 17, '#fff9ed72');
      oval(ctx, x - 13, y - 9, w * .46, 20, '#fff9ed72');
    }
    const depths = [[654,211,49,119],[712,242,32,97],[757,190,51,147],[816,222,42,115],[872,236,50,109],
      [931,218,52,125],[996,189,55,151],[1074,228,48,118],[1148,205,41,140],[1198,180,43,173]];
    for (const [x,y,w,h] of depths) {
      rounded(ctx,x,y,w,h,4,theme.skyline);
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = (row + col) % 3 ? '#fff6dc55' : '#fdf6d195';
          ctx.fillRect(x + 6 + col * (w - 11) / 3, y + 10 + row * 17, Math.max(3, w / 8), 8);
        }
      }
    }
    ctx.fillStyle = '#e4b38b';
    ctx.fillRect(left, 318, 740, 53);
    for (const [x,y,s] of [[658,325,1.0],[841,336,.65],[1090,326,.92],[1234,324,1.1]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      rounded(ctx,-6,-72,12,78,3,'#917457');
      oval(ctx,-23,-76,27,36,theme.plant,-.27);
      oval(ctx,16,-70,25,32,theme.plant,.24);
      oval(ctx,0,-97,31,37,'#92c78c');
      oval(ctx,-9,-111,12,17,'#c1dfaa',-.55);
      ctx.restore();
    }
    poly(ctx,[[592,50],[682,50],[808,355],[727,355]],'#ffffff29');
    poly(ctx,[[830,50],[881,50],[1007,355],[967,355]],'#ffffff20');
    ctx.restore();

    for (const x of [568, 795, 1025, 1255]) {
      ctx.fillStyle = gradient(ctx, x, 0, x + 14, 0, [[0,'#221e35'],[.58,theme.frame],[1,'#af6568']]);
      ctx.fillRect(x, 57, 13, 297);
    }
    rounded(ctx,left - 13,179,730,10,4,'#342538');
    rounded(ctx,left - 20,351,742,27,8,vertical(ctx,351,377,'#854758','#d4937c','#4c3241'));

    ctx.save();
    ctx.translate(587,61);
    ctx.rotate(-.035);
    for (let i = 0; i < 12; i++) {
      const color = i % 2 ? '#ffe7d6' : theme.accent;
      const darker = i % 2 ? '#d8a79a' : theme.shade;
      const x = i * 59;
      path(ctx, p => {
        p.moveTo(x,0);
        p.lineTo(x + 55,0);
        p.lineTo(x + 64,61);
        p.quadraticCurveTo(x + 38, 88, x + 4,64);
        p.closePath();
      }, vertical(ctx,0,76,color,darker));
    }
    ctx.restore();
  }

  function menuBoard(ctx, theme) {
    ctx.save();
    ctx.translate(22,86);
    ctx.rotate(-.035);
    rounded(ctx,0,0,478,134,22,'#3e2734');
    rounded(ctx,4,4,470,120,18,theme.accent);
    rounded(ctx,10,10,458,104,13,vertical(ctx,10,114,'#fff8e2','#ffcf9c'));
    for (const x of [156,314]) rounded(ctx, x, 18, 2, 81, 1, '#8d47584f');
    food(ctx,'bun-bottom',84,82,90,17);
    food(ctx,'beef',84,71,98,23);
    food(ctx,'cheese',84,59,96,16);
    food(ctx,'lettuce',84,53,100,17);
    food(ctx,'bun-top',84,38,93,40);
    food(ctx,'fries',236,57,114,77);
    food(ctx,'soda',388,57,106,80);
    ctx.restore();
  }

  function pendant(ctx, x, y, scale, theme) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    ctx.fillStyle = radial(ctx, 0, 22, 115, '#ffdb7a56', '#ffca6300');
    ctx.fillRect(-115,-93,230,230);
    ctx.fillStyle='#78354b';
    ctx.fillRect(-4,-98,8,82);
    path(ctx,p=>{
      p.moveTo(-47,18);
      p.quadraticCurveTo(-34,-32,0,-35);
      p.quadraticCurveTo(38,-31,47,18);
      p.closePath();
    },vertical(ctx,-35,17,theme.shade,theme.accent,'#fba075'));
    oval(ctx,0,19,47,10,'#76343a');
    oval(ctx,0,20,41,7,'#ffd886');
    oval(ctx,0,22,27,6,'#fff7cc');
    ctx.restore();
  }

  function backdrop(ctx,w,h,locationIndex=0) {
    const theme = restaurantThemes[((locationIndex % restaurantThemes.length) + restaurantThemes.length) % restaurantThemes.length];
    ctx.save();
    ctx.scale(w / 1280, h / 720);
    ctx.fillStyle = vertical(ctx,0,439,'#674356','#f9e2ce','#e8b1a0');
    ctx.fillRect(0,0,1280,462);
    for (let i = 0; i < 32; i++) {
      const x = i * 40;
      ctx.fillStyle = i % 2 ? theme.accent : '#fff1e6';
      ctx.fillRect(x,0,40,40);
      ctx.fillStyle = i % 2 ? '#fff1e6' : theme.accent;
      ctx.fillRect(x,40,40,40);
      ctx.fillStyle = '#3d26322a';
      ctx.fillRect(x,39,40,1);
      ctx.fillRect(x,79,40,1);
    }
    for (let y = 231; y < 439; y += 33) {
      ctx.fillStyle='#874f6c2b'; ctx.fillRect(0,y,1280,2);
      for (let x = y % 2 ? 22 : 0; x < 1280; x += 65) ctx.fillRect(x,y,1,33);
    }
    kitchenWindow(ctx,theme);
    menuBoard(ctx,theme);

    rounded(ctx,33,257,455,108,17,vertical(ctx,257,365,'#747787','#342e40','#8b8093'));
    rounded(ctx,49,269,416,75,10,'#272435');
    for (let x=70;x<450;x+=13) {
      ctx.fillStyle='#a3a4b247'; ctx.fillRect(x,276,2,59);
    }
    for (const x of [95,215,335]) {
      food(ctx,'beef', x,303,79,31);
      for (let i=0;i<2;i++) {
        path(ctx,p=>{
          p.moveTo(x+i*16-10,297);
          p.bezierCurveTo(x+i*16-26,278,x+i*16+13,266,x+i*16-4,245);
        },null,'#fff7e37d',3);
      }
    }
    for (let i=0;i<4;i++) {
      oval(ctx,70+27*i,354,6,5,(i===1 || i===2)?'#ffb467':'#483c50');
    }
    rounded(ctx,0,378,1280,93,26,vertical(ctx,378,470,theme.shade,theme.accent,'#6a2b41'));
    for (let x=10;x<1280;x+=71) rounded(ctx,x,394,64,65,18,'#ffffff20');
    rounded(ctx,0,438,1280,43,3,vertical(ctx,438,480,'#fff2d3','#d6a67e','#9c5f53'));
    ctx.fillStyle='#ffffffb4';
    ctx.fillRect(0,438,1280,4);
    pendant(ctx,260,28,.96,theme);
    pendant(ctx,535,71,.95,theme);
    pendant(ctx,1087,3,1.01,theme);
    counterTexture(ctx);
    ctx.restore();
  }

  function customer(ctx,x,y,scale,variant,mood=1,bob=0) {
    const person = people[((variant % people.length) + people.length) % people.length];
    const smile = Math.max(0,Math.min(1,mood));
    const sway = Math.sin(bob + variant * .71);
    ctx.save();
    ctx.translate(x,y + sway * 2.3);
    ctx.scale(scale,scale);
    ctx.lineCap='round';
    ctx.lineJoin='round';

    oval(ctx,0,-1,59,10,'#31223838');
    if (person.style === 2) {
      oval(ctx,-36,-71,23,42,person.hair[1],.28);
      oval(ctx,32,-74,29,37,person.hair[1],-.45);
    }

    const apron = variant % 6 === 0;
    const shirt = vertical(ctx,-64,0,...person.shirt);
    path(ctx,p=>{
      p.moveTo(-53,-7);
      p.quadraticCurveTo(-56,-41,-37,-50);
      p.quadraticCurveTo(-25,-55,-16,-61);
      p.lineTo(13,-61);
      p.quadraticCurveTo(25,-53,37,-51);
      p.quadraticCurveTo(56,-43,54,-7);
      p.quadraticCurveTo(4,7,-53,-7);
      p.closePath();
    },shirt,'#493041',2);
    rounded(ctx,-13,-65,26,23,10,vertical(ctx,-66,-42,...person.skin.slice().reverse()));
    path(ctx,p=>{
      p.moveTo(-19,-48);
      p.lineTo(-11,-40);
      p.quadraticCurveTo(0,-31,13,-40);
      p.lineTo(19,-49);
    },null,'#fffcf18e',3.4);
    if(apron) {
      path(ctx,p=>{
        p.moveTo(-30,-49); p.lineTo(-23,-51); p.lineTo(-18,-25); p.lineTo(18,-25);
        p.lineTo(22,-52); p.lineTo(29,-48); p.lineTo(27,-7); p.quadraticCurveTo(0,0,-27,-7);
        p.closePath();
      },vertical(ctx,-48,0,'#e8413a','#96223c'));
      ctx.fillStyle='#fff4e6'; ctx.font='900 11px system-ui'; ctx.textAlign='center';
      ctx.fillText('SG',0,-12);
    } else {
      path(ctx,p=>{p.moveTo(-39,-40);p.lineTo(-34,-26);p.moveTo(39,-40);p.lineTo(34,-26);},null,'#2d214d57',2.5);
    }

    const skin = gradient(ctx,-17,-144,35,-53,[[0,person.skin[0]],[.68,person.skin[0]],[1,person.skin[1]]]);
    const hair = gradient(ctx,-12,-146,27,-92,[[0,person.hair[0]],[1,person.hair[1]]]);

    oval(ctx,0,-110,42,44,person.hair[1]);
    for (const side of [-1,1]) {
      oval(ctx,side*36,-96,10,13,skin,side*.2);
      oval(ctx,side*39,-95,3.5,6,person.skin[1],side*.3);
    }
    path(ctx,p=>{
      p.moveTo(-35,-113);
      p.bezierCurveTo(-29,-137,25,-140,35,-111);
      p.bezierCurveTo(38,-91,30,-76,20,-68);
      p.quadraticCurveTo(3,-56,-15,-65);
      p.bezierCurveTo(-33,-71,-39,-93,-35,-113);
      p.closePath();
    },skin,'#70433d',1.4);

    if (person.style===1) {
      for(const [hx,hy,hr] of [[-34,-117,16],[-20,-137,18],[2,-146,20],[22,-136,17],[35,-119,14]]) {
        oval(ctx,hx,hy,hr,hr*.82,hair,-.2);
        oval(ctx,hx-4,hy-5,hr*.53,hr*.23,'#ffffff1e',-.38);
      }
    } else {
      path(ctx,p=>{
        p.moveTo(-39,-108);
        p.bezierCurveTo(-51,-144,-22,-159,0,-155);
        p.quadraticCurveTo(31,-163,41,-130);
        p.quadraticCurveTo(45,-113,34,-103);
        p.quadraticCurveTo(32,-125,16,-130);
        p.quadraticCurveTo(4,-117,-18,-117);
        p.quadraticCurveTo(-30,-115,-35,-101);
        p.closePath();
      },hair,'#422538',2.1);
      path(ctx,p=>{p.moveTo(-32,-132);p.bezierCurveTo(-29,-145, -10,-152, 9,-147);},null,'#ffffff38',3.4);
    }

    const blink = Math.sin(bob * .4 + variant * 2) > .993;
    for (const side of [-1,1]) {
      const ex = side * 14.5;
      path(ctx,p=>{
        p.moveTo(ex-6,-108+side*(1-smile)*1.5);
        p.quadraticCurveTo(ex,-112-(smile*2),ex+6,-108-side*(1-smile)*1.5);
      },null,person.hair[1],2.7);
      if (blink) {
        path(ctx,p=>{p.moveTo(ex-5,-100);p.quadraticCurveTo(ex,-97,ex+6,-102);},null,person.eyes,2.1);
      } else {
        oval(ctx,ex,-100,9,9.5,'#fff7e7',side*.13);
        oval(ctx,ex+.8,-99.7,5.3,7,person.eyes);
        oval(ctx,ex-1.1,-103.1,2.2,2.3,'#fff');
        oval(ctx,ex+2.4,-97.7,1.1,1.1,'#fff7e6');
      }
      oval(ctx,side*24,-85,7.8,4.4,'#f3818c65',side*.14);
    }
    path(ctx,p=>{p.moveTo(0,-99);p.quadraticCurveTo(-6,-91,2,-91);},null,'#9f493853',2);
    if(smile > .53) {
      path(ctx,p=>{
        p.moveTo(-12,-83);p.quadraticCurveTo(0,-77,13,-85);
        p.quadraticCurveTo(9,-70,-1,-72);p.quadraticCurveTo(-10,-74,-12,-83);p.closePath();
      },'#6c2c42');
      path(ctx,p=>{p.moveTo(-9,-82);p.quadraticCurveTo(1,-78,10,-83);},null,'#fff1de',2.8);
      oval(ctx,1,-74,5.1,1.7,'#e67884');
    } else {
      path(ctx,p=>{p.moveTo(-8,-79);p.quadraticCurveTo(-1,-80-(.5-smile)*8,8,-80);},null,'#71373d',2.6);
    }

    if (person.style===3 || variant % 6 === 1) {
      const frames = person.style === 3 ? '#6e3755' : '#273647';
      path(ctx,p=>{p.roundRect(-29,-108,25,17,5);p.roundRect(4,-108,25,17,5);},'#ffffff22',frames,2.7);
      path(ctx,p=>{p.moveTo(-4,-101);p.quadraticCurveTo(0,-104,4,-101);p.moveTo(-29,-103);p.lineTo(-37,-107);p.moveTo(29,-103);p.lineTo(37,-107);},null,frames,2.8);
    }

    if(apron) {
      path(ctx,p=>{
        p.moveTo(-40,-126);p.quadraticCurveTo(-37,-155,-2,-153);p.quadraticCurveTo(24,-153,33,-128);
        p.lineTo(34,-126);p.quadraticCurveTo(-2,-139,-40,-126);p.closePath();
      },vertical(ctx,-155,-125,'#fa6b58','#bf2b38'),'#8f233c',1.1);
      path(ctx,p=>{
        p.moveTo(-40,-128);p.quadraticCurveTo(6,-143,44,-125);p.quadraticCurveTo(46,-119,30,-116);
        p.quadraticCurveTo(-3,-129,-40,-123);p.closePath();
      },'#d8393e','#97283b',1.1);
      ctx.fillStyle='#fff8e9';ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillText('SG',-6,-138);
    }
    ctx.restore();
  }

  function bun(ctx, top) {
    if (top) {
      path(ctx,p=>{
        p.moveTo(-56,13);p.bezierCurveTo(-56,-18,-31,-29,0,-28);
        p.bezierCurveTo(30,-29,56,-18,56,13);
        p.quadraticCurveTo(54,26,0,26);p.quadraticCurveTo(-54,26,-56,13);p.closePath();
      },vertical(ctx,-28,26,'#fff4a6','#f5b443','#cc622a','#84351f'),'#92412b',2);
      oval(ctx,-15,-16,26,7,'#fff6ca63',-.13);
      for(const [sx,sy,a] of [[-39,0,.2],[-28,-13,-.55],[-11,-17,.4],[4,-21,-.28],[19,-14,.8],[33,-9,-.3],[47,3,1.05],[-15,-5,.25],[8,-7,-.4],[26,2,.4],[-11,6,1],[2,3,-.8]]) {
        oval(ctx,sx+1,sy+1,4.4,1.7,'#a55b3e7a',a);
        oval(ctx,sx,sy,4.4,1.6,'#ffe9a7',a);
      }
    } else {
      path(ctx,p=>{
        p.moveTo(-57,-11);p.quadraticCurveTo(-28,-26,0,-25);p.quadraticCurveTo(34,-25,57,-11);
        p.bezierCurveTo(59,20,46,27,0,27);p.bezierCurveTo(-46,27,-58,20,-57,-11);p.closePath();
      },vertical(ctx,-25,27,'#965031','#e79743','#c36026'),'#93502c',2);
      oval(ctx,0,-11,55,13,vertical(ctx,-24,-2,'#ffe9a1','#eaad63'));
      for(const [x,y] of [[-41,-12],[-13,-14],[3,-9],[18,-17],[31,-8],[39,-14]]) oval(ctx,x,y,1.9,1.1,'#ae623b83');
    }
  }

  function patty(ctx,chicken) {
    const colors = chicken ? ['#ffd378','#c78037','#88512b'] : ['#a45b3a','#703526','#47231e'];
    path(ctx,p=>{
      p.moveTo(-58,-3);p.bezierCurveTo(-64,-19,-36,-26,0,-25);p.bezierCurveTo(22,-28,59,-18,58,-6);
      p.quadraticCurveTo(62,23,24,25);p.quadraticCurveTo(0,29,-27,25);p.quadraticCurveTo(-65,20,-58,-3);
      p.closePath();
    },vertical(ctx,-25,26,...colors),'#542a23',2);
    oval(ctx,-7,-10,42,11,chicken?'#fff4ba4c':'#e3a17c46',-.05);
    for(let i=0;i<25;i++) {
      const x = (i*43)%107-53;
      const y = (i*31)%31-14;
      oval(ctx,x,y,1.5+(i%3),1.0+(i%2)*.6,i%2?'#ffdb8e5d':'#2e18185e',i*.73);
    }
    if(!chicken){
      for(let i=0;i<6;i++) {
        const x=-45+i*15;
        path(ctx,p=>{p.moveTo(x,-6);p.lineTo(x+8,-17);},null,'#2b181582',2);
      }
    }
  }

  function crisp(ctx,key) {
    if(key==='cheese') {
      poly(ctx,[[-58,-11],[-25,-27],[38,-22],[59,-2],[14,24],[-9,17],[-34,29],[-44,6]],vertical(ctx,-25,25,'#fff099','#ffce43','#ed8e1c'),'#c26524',1.5);
      path(ctx,p=>{p.moveTo(-44,-9);p.lineTo(-24,-20);p.lineTo(35,-16);},null,'#fffbe66b',2);
    }
    if(key==='lettuce') {
      path(ctx,p=>{
        p.moveTo(-56,-4);p.quadraticCurveTo(-66,-18,-52,-16);p.quadraticCurveTo(-58,-30,-37,-22);
        p.quadraticCurveTo(-30,-32,-19,-24);p.quadraticCurveTo(-6,-36,7,-25);p.quadraticCurveTo(28,-35,31,-22);
        p.quadraticCurveTo(53,-27,52,-13);p.quadraticCurveTo(67,-10,55,1);p.quadraticCurveTo(65,17,51,18);
        p.quadraticCurveTo(33,17,31,25);p.quadraticCurveTo(15,32,6,23);p.quadraticCurveTo(-7,34,-18,24);
        p.quadraticCurveTo(-34,30,-39,17);p.quadraticCurveTo(-57,20,-56,10);p.quadraticCurveTo(-65,9,-56,-4);
        p.closePath();
      },vertical(ctx,-26,25,'#e0f085','#83c444','#3a863d'),'#357440',1.6);
      path(ctx,p=>{
        p.moveTo(-45,6);p.quadraticCurveTo(-9,-2,40,-10);
        p.moveTo(-23,2);p.lineTo(-36,-12);
        p.moveTo(-3,-2);p.lineTo(-12,-20);
        p.moveTo(2,-3);p.lineTo(18,15);
        p.moveTo(20,-6);p.lineTo(34,8);
      },null,'#e8f397b7',2.2);
    }
    if(key==='tomato') {
      for(const [x,y,r] of [[-20,-3,-.11],[20,5,.10]]) {
        ctx.save();ctx.translate(x,y);ctx.rotate(r);
        oval(ctx,0,3,36,21,'#a13231');
        oval(ctx,0,0,36,20,vertical(ctx,-20,20,'#ff9573','#fa523b','#bf2832'));
        oval(ctx,0,-1,29,14,'#ffab7972');
        for(let i=0;i<6;i++){
          const angle = i*TAU/6;
          oval(ctx,Math.cos(angle)*16,Math.sin(angle)*8,3.7,1.5,'#fff3aa',angle/1.3);
        }
        oval(ctx,0,0,5,3.7,'#ffc36e');
        ctx.restore();
      }
    }
    if(key==='onion'){
      for(const [x,y,rx] of [[-27,-6,27],[12,4,32],[26,-8,20]]) {
        ctx.beginPath();ctx.ellipse(x,y,rx,14,0,0,TAU);ctx.lineWidth=6;ctx.strokeStyle='#a93d78';ctx.stroke();
        ctx.beginPath();ctx.ellipse(x,y-1,rx-2,12,0,0,TAU);ctx.lineWidth=3;ctx.strokeStyle='#ffc0de';ctx.stroke();
      }
    }
    if(key==='pickle') {
      for(const [x,y,a] of [[-29,0,-.2],[3,-9,.1],[24,8,-.07]]) {
        oval(ctx,x,y,27,15,'#4e7736',a);
        oval(ctx,x,y-2,24,12,'#a0bd57',a);
        oval(ctx,x,y-2,18,9,'#bcd87d',a);
        for(let i=0;i<5;i++) oval(ctx,x-12+i*6,y-2+Math.sin(i*1.4)*4,2.2,1.1,'#eff0aa',.35);
      }
    }
  }

  function sauce(ctx,key) {
    const [dark,light] = {
      ketchup:['#a02329','#ff6d56'],
      mustard:['#bd731b','#ffe876'],
      special:['#b45337','#ffa986'],
    }[key];
    const drizzle = p=>{
      p.moveTo(-49,2);p.bezierCurveTo(-40,-24,-29,14,-16,11);
      p.bezierCurveTo(-4,9,-10,-12,2,-13);p.bezierCurveTo(14,-14,16,11,27,10);
      p.bezierCurveTo(39,8,36,-10,48,-6);
    };
    path(ctx,drizzle,null,dark,11);
    path(ctx,drizzle,null,light,6.8);
    path(ctx,drizzle,null,'#fff8dd4f',1.6);
  }

  function fries(ctx) {
    const sticks=[[-33,-12,-.23],[-23,-18,-.16],[-13,-13,.05],[-2,-21,-.08],[8,-18,.11],[15,-16,.28],[25,-22,.14],[32,-10,.29]];
    for(const [x,y,a] of sticks) {
      ctx.save();ctx.translate(x,y);ctx.rotate(a);
      rounded(ctx,-4,-9,8,33,2,vertical(ctx,-10,25,'#fff5a0','#ffce44','#d77b21'));
      rounded(ctx,-3,-8,2,29,1,'#fff4b6');
      ctx.restore();
    }
    path(ctx,p=>{
      p.moveTo(-47,-4);
      p.quadraticCurveTo(-19,7,0,6);
      p.quadraticCurveTo(29,7,47,-4);
      p.lineTo(34,26);
      p.quadraticCurveTo(0,34,-34,26);
      p.closePath();
    },gradient(ctx,-49,-6,49,25,[[0,'#ad2130'],[.3,'#fa513e'],[.75,'#da302f'],[1,'#9b2632']]),'#932637',1.6);
    path(ctx,p=>{p.moveTo(-36,5);p.quadraticCurveTo(0,14,36,5);},null,'#ffefbe',2);
    ctx.fillStyle='#fff7e4';ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.fillText('SG',0,24);
  }

  function drink(ctx,shake) {
    const [top,bottom] = shake ? ['#aa7b9f','#73476b'] : ['#fc5440','#a62334'];
    path(ctx,p=>{
      p.moveTo(-31,-14); p.lineTo(-23,24); p.quadraticCurveTo(0,33,23,24);
      p.lineTo(31,-14);p.closePath();
    },gradient(ctx,-30,0,29,0,[[0,bottom],[.35,top],[.8,top],[1,bottom]]),'#6f3345',1.6);
    if(shake) {
      path(ctx,p=>{
        p.moveTo(-26,-13);p.quadraticCurveTo(-22,-22,-16,-21);p.quadraticCurveTo(-15,-28,-5,-28);
        p.quadraticCurveTo(3,-31,4,-35);p.quadraticCurveTo(12,-29,12,-25);
        p.quadraticCurveTo(27,-25,27,-13);p.closePath();
      },vertical(ctx,-35,-13,'#fff2de','#f7b5c5'),'#9d586f',1.3);
    } else {
      path(ctx,p=>{p.moveTo(3,-16);p.lineTo(9,-33);p.lineTo(24,-34);},null,'#b12b3c',5.6);
      path(ctx,p=>{p.moveTo(2,-17);p.lineTo(8,-34);p.lineTo(23,-34);},null,'#ff6972',3.4);
    }
    oval(ctx,0,-13,34,7,'#a793a4');
    oval(ctx,0,-15,32,6,'#fff3de');
    path(ctx,p=>{p.moveTo(-24,12);p.quadraticCurveTo(0,4,24,12);},null,'#ffebce9c',1.7);
    ctx.fillStyle='#fff7e4';ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillText('SG',0,10);
  }

  function sides(ctx,key) {
    if(key==='fries')return fries(ctx);
    if(key==='soda'||key==='shake')return drink(ctx,key==='shake');
    oval(ctx,0,21,46,8,'#6b3d3b4d');
    for(const [x,y,scale,rotation] of [[-26,5,.95,-.32],[23,5,.89,.39],[-2,-8,1.1,.13],[3,12,.95,-.21]]) {
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);
      if(key==='rings') {
        ctx.beginPath();
        ctx.ellipse(0,0,22,12,0,0,TAU);
        ctx.ellipse(0,0,11,5.8,0,0,TAU,true);
        ctx.fillStyle=vertical(ctx,-11,12,'#ffe486','#d58632','#8d492a');
        ctx.fill('evenodd');
        for(let i=0;i<8;i++)oval(ctx,Math.cos(i*.8)*17,Math.sin(i*.8)*8,1.3,1.0,'#ffdc8b');
      } else {
        path(ctx,p=>{
          p.moveTo(-16,0);p.quadraticCurveTo(-21,-9,-8,-10);p.quadraticCurveTo(6,-14,15,-6);
          p.quadraticCurveTo(23,9,9,11);p.quadraticCurveTo(-15,15,-16,0);p.closePath();
        },vertical(ctx,-13,12,'#ffe48e','#e4a13f','#9d5530'),'#aa5c28',1.3);
        for(let i=0;i<9;i++)oval(ctx,(i*7)%26-13,(i*11)%15-8,1.4,1.1,i%2?'#ffde8e':'#a95d2b90');
      }
      ctx.restore();
    }
  }

  function food(ctx,key,x,y,w,h) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(w/120,h/72);
    ctx.lineCap='round';
    ctx.lineJoin='round';
    switch(key) {
      case 'bun-top': bun(ctx,true); break;
      case 'bun-bottom': bun(ctx,false); break;
      case 'beef':
      case 'chicken': patty(ctx,key==='chicken'); break;
      case 'cheese':
      case 'lettuce':
      case 'tomato':
      case 'onion':
      case 'pickle': crisp(ctx,key); break;
      case 'ketchup':
      case 'mustard':
      case 'special': sauce(ctx,key); break;
      case 'fries':
      case 'rings':
      case 'soda':
      case 'shake':
      case 'nuggets': sides(ctx,key);
    }
    ctx.restore();
  }

  window.SGBurgerArt = Object.freeze({ backdrop, customer, food });
})();
