(() => {
  'use strict';

  const palettes = [
    { wall: '#d07a54', side: '#884c54', roof: '#ddd5c3', window: '#566e88', trim: '#ffdab7', accent: '#e95249' },
    { wall: '#79a6ca', side: '#456584', roof: '#cadce3', window: '#375675', trim: '#d3f4ef', accent: '#39a29c' },
    { wall: '#e8c28d', side: '#a3776a', roof: '#eee4cd', window: '#4f7290', trim: '#fff0c8', accent: '#c75651' },
    { wall: '#9d91be', side: '#605a87', roof: '#d8cee1', window: '#586482', trim: '#e2cef2', accent: '#f29c69' },
    { wall: '#b5b78f', side: '#6b7c67', roof: '#e0e2b8', window: '#526f75', trim: '#ebe8ce', accent: '#3b9b82' },
    { wall: '#618da5', side: '#3d5773', roof: '#c0d4d5', window: '#294b66', trim: '#c3e9e2', accent: '#f3ae48' }
  ];
  const cars = [
    ['#ff6a55', '#d03952', '#77354c'], ['#6ee8ff', '#3282cc', '#284887'],
    ['#ffee8a', '#f3a748', '#a25536'], ['#cbeafe', '#92abc8', '#596380'],
    ['#ba97ff', '#7350c1', '#463366'], ['#b8f48c', '#74b959', '#486e54']
  ];
  const trees = [
    ['#b6dd50', '#78a92b', '#416b37'], ['#d9ea60', '#94b938', '#527439'],
    ['#7fcf72', '#54a34d', '#306a48'], ['#f5b269', '#d78a4e', '#874c4e'],
    ['#a6df67', '#6faf48', '#39784b'], ['#efd267', '#d3a549', '#88714b']
  ];
  const spriteSpecs = {
    trash: [-45, -44, 103, 76], cone: [-44, -57, 100, 86],
    planter: [-48, -66, 108, 100], bench: [-49, -53, 110, 91],
    table: [-48, -76, 107, 108], lamp: [-39, -102, 96, 137],
    tree: [-51, -113, 115, 153], car: [-48, -48, 109, 90],
    truck: [-49, -62, 113, 102], house: [-55, -88, 124, 132],
    building: [-55, -121, 124, 167], tower: [-56, -149, 126, 195]
  };
  const cache = new Map();

  function polygon(ctx, color, ...vertices) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(...vertices[0]);
    for (const vertex of vertices.slice(1)) ctx.lineTo(...vertex);
    ctx.closePath();
    ctx.fill();
  }

  function ellipse(ctx, color, x, y, rx, ry, rotation = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    ctx.fill();
  }

  function box(ctx, color, x, y, w, h, radius = 0) {
    ctx.fillStyle = color;
    if (!radius) {
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  }

  function line(ctx, color, width, ...points) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function gradient(ctx, x0, y0, x1, y1, ...colors) {
    const result = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((color, index) => result.addColorStop(index / (colors.length - 1), color));
    return result;
  }

  function shadow(ctx, x, y, radius, height) {
    ellipse(ctx, '#35264322', x+5, y+2, radius+3, height+1, .09);
    ellipse(ctx, '#241b372f', x+3, y, radius, height, .09);
    ellipse(ctx, '#18142a2a', x, y-1, radius*.76, height*.75, .09);
  }

  function brickwork(ctx, x, y, w, h, wall) {
    box(ctx, wall, x, y, w, h);
    for (let row = 0; row < Math.floor(h / 5); row++) {
      const sy = y + 4 + row * 5;
      line(ctx, '#412b4b24', .7, [x, sy], [x + w, sy]);
      for (let col = 0; col < Math.floor(w / 8); col++) {
        const sx = x + (row % 2 ? 3 : 7) + col * 8;
        line(ctx, '#ffdbc82b', .65, [sx, sy - 3.8], [sx, sy]);
      }
    }
  }

  function windowPane(ctx, x, y, w, h, theme) {
    box(ctx, '#332a494a', x+1, y+2, w+2, h, 1);
    box(ctx, theme.trim, x, y, w+1, h+1, .8);
    box(ctx, gradient(ctx, x, y, x+w, y+h, '#a2cfda', theme.window, '#2d4665'), x+1.2, y+1.2, w-1.4, h-1.7);
    polygon(ctx, '#e8edfa34', [x+2,y+2], [x+w-2,y+2], [x+2,y+h*.61]);
    if (w > 6) line(ctx, '#ddecf18e', .7, [x+w*.5,y+1.2], [x+w*.5,y+h-1]);
    if (h > 7) line(ctx, '#ddecf161', .6, [x+1.4,y+h*.59], [x+w-.2,y+h*.59]);
    box(ctx, theme.trim, x-.5, y+h, w+2.1, 1.2);
  }

  function roofFixture(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    polygon(ctx, '#30324c50', [-1,-4], [14,-4], [19,1], [2,3]);
    polygon(ctx, '#aaaeb9', [0,-4], [13,-4], [10,1], [0,1]);
    polygon(ctx, '#686b82', [10,-5], [13,-9], [13,-4], [10,1]);
    polygon(ctx, '#f4e8e0', [0,-5], [4,-9], [13,-9], [10,-5]);
    box(ctx, '#626c85', 3,-7.6, 5,1.1,.2);
    line(ctx, '#ddd7d7', .5, [1,-3], [9,-3]);
    ctx.restore();
  }

  function house(ctx, variant, theme) {
    shadow(ctx, 2, 12, 43, 16);
    polygon(ctx, theme.side, [23,-35], [36,-47], [36,-3], [23,10]);
    brickwork(ctx, -30, -38, 54, 48, gradient(ctx, -30, -38, 24, 10, theme.trim, theme.wall, theme.wall));
    box(ctx, '#d1a394', -31, 8, 56, 4, 1);
    windowPane(ctx, -22, -29, 12, 13, theme);
    windowPane(ctx, 5, -29, 12, 13, theme);
    windowPane(ctx, -21, -8, 11, 10, theme);
    box(ctx, '#634259', -4, -9, 12, 19, 1.5);
    box(ctx, '#935c58', -2.4, -7.5, 9, 16, 1.1);
    box(ctx, '#c68868', -.5,-5.7,5.5,8.4, .8);
    ellipse(ctx, '#f9d889', 4.3, 2, .9,.9);
    polygon(ctx, '#a3b9ba', [26,-26], [33,-33], [33,-21], [26,-14]);
    polygon(ctx, '#3a6174', [27,-25], [32,-30], [32,-23], [27,-18]);
    box(ctx, '#d0a394', -6, 9, 17, 3,1);
    const colors = ['#bc504f', '#575d8d', '#bf754b', '#85578d', '#6a8562', '#496783'];
    const roof = colors[variant];
    polygon(ctx, '#4e3b5d46', [-35,-35], [24,-35], [39,-48], [34,-42], [25,-31], [-35,-31]);
    polygon(ctx, roof, [-35,-38], [-3,-64], [28,-38]);
    polygon(ctx, gradient(ctx, -7, -67, 39, -42, theme.trim, roof, '#54405c'),
      [-3,-64], [10,-76], [42,-49], [28,-38]);
    for (let i = 1; i < 5; i++) {
      line(ctx, '#32264136', .9, [-35+6*i,-38-5*i], [-3, -38-5*i], [28-6*i,-38-5*i]);
      line(ctx, '#ffe3c94a', .8, [-3+2.6*i,-64-2.4*i], [28+2.8*i,-38-2.2*i]);
    }
    line(ctx, '#f2b79c', 2.1, [-34,-38], [-3,-63], [28,-38], [41,-49]);
    polygon(ctx, '#a66758', [19,-58], [24,-58], [24,-48], [19,-51]);
    polygon(ctx, '#e0a07c', [19,-58], [22,-61], [27,-61], [24,-58]);
    polygon(ctx, '#794755', [24,-58], [27,-61], [27,-51], [24,-48]);
    for (const x of [-24, 19]) {
      ellipse(ctx, '#63834b', x, 11, 5.7, 3.4);
      ellipse(ctx, '#98c658', x-2, 8, 3.2, 3.2);
      ellipse(ctx, '#7db653', x+1.4, 7.5, 3.9, 3.6);
    }
  }

  function storefront(ctx, theme, variant) {
    box(ctx, '#424a65', -27, -15, 47, 26, 1);
    box(ctx, '#94aabe', -24, -12, 15, 17, 1);
    box(ctx, '#3a5470', -23, -11, 13, 15, 1);
    polygon(ctx, '#f6e9c44d', [-23,-10], [-11,-10], [-23,2]);
    box(ctx, '#e5c5a4', -5, -12, 10, 22, 1);
    box(ctx, '#465a74', -3.8,-10.5,7.4,19.3,.8);
    box(ctx, '#fceeb4', 1.4, 2.1, 1.5, 1.5, .6);
    box(ctx, '#4c7182', 7, -11, 10, 15, 1);
    polygon(ctx, '#ffebb887', [8,-10],[16,-10],[16,-2],[11,4],[8,4]);
    for (let i = 0; i < 10; i++) {
      const x = -28 + i*4.9;
      const bright = i%2 ? '#fff0d4' : theme.accent;
      const front = i%2 ? '#d9bfae' : variant === 0 ? '#a63e43' : theme.side;
      polygon(ctx, bright, [x,-23], [x+5,-23], [x+5.7,-15], [x+.7,-15]);
      box(ctx, front, x+.7,-15.6,5,4,1.2);
    }
    line(ctx, '#f9eed4', 1.5, [-28,-23.4], [21.5,-23.4]);
    box(ctx, '#b9aa86', -29, 8, 51, 4, 1);
  }

  function building(ctx, variant, theme, tall) {
    const w = tall ? 57 : 58;
    const x = -33;
    const y = tall ? -115 : -76;
    const end = x+w;
    const right = 17;
    const rise = 15;
    const floor = 12;
    shadow(ctx, 7, 10, 44, 21);
    polygon(ctx, '#28223d24', [end+right, -4], [end+34, y/4], [end+40, 3], [end+11, 24], [-8,16]);
    polygon(ctx, gradient(ctx, end, y, end+right, y, theme.side, '#455370'),
      [end,y], [end+right,y-rise], [end+right,floor-rise], [end,floor]);
    const face = gradient(ctx, x, y, end, floor, theme.wall, theme.wall, theme.side);
    if (tall || variant === 1 || variant === 5) box(ctx, face, x, y, w, floor-y);
    else brickwork(ctx, x, y, w, floor-y, face);
    const rows = tall ? 7 : 4;
    const pitch = (Math.abs(y)-22)/(rows);
    for (let row = 0; row < rows; row++) {
      const ry = y+7+row*pitch;
      for (let col = 0; col < (tall ? 5 : 4); col++) {
        const colWidth = (w-9)/(tall?5:4);
        windowPane(ctx, x+5+col*colWidth, ry, colWidth-3.9, pitch-4.8, theme);
      }
      for (let col = 0; col < 2; col++) {
        const xx = end + 3 + col*7;
        const yy = ry - 3 - col*6;
        polygon(ctx, '#d6d1c494', [xx,yy], [xx+4.7,yy-4], [xx+4.7,yy+pitch-9], [xx,yy+pitch-5]);
        polygon(ctx, theme.window, [xx+.7,yy+.1], [xx+4,yy-2.7], [xx+4,yy+pitch-9], [xx+.7,yy+pitch-6.1]);
        line(ctx, '#c0d8e180', .6, [xx+.7,yy+3], [xx+4,yy+.3]);
      }
      if (tall || row%2 === 0) line(ctx, '#f3e7d74f', .9, [x,ry-2], [end,ry-2], [end+right,ry-rise-2]);
    }
    if (tall) {
      box(ctx, '#25384c', x+4, -15, w-8, 25, 1);
      for (let i = 0; i < 5; i++) windowPane(ctx, x+7+i*9.8, -12, 7.1, 18, theme);
      box(ctx, theme.trim, x+2, 9, w-4, 3, 1);
    } else storefront(ctx, theme, variant);
    polygon(ctx, '#7a788e', [x-2,y-1], [end+2,y-1], [end+right+2,y-rise-1], [end+right+2,y-rise-5], [end+2,y-5], [x-2,y-5]);
    polygon(ctx, gradient(ctx, x, y, end, y-12, '#f4e8cf', theme.roof),
      [x-2,y-5], [x+right-2,y-rise-5], [end+right+2,y-rise-5], [end+2,y-5]);
    polygon(ctx, '#6e789340', [x+4,y-7.8],[x+right+2,y-rise-3], [end+right-7,y-rise-3], [end-1,y-7.8]);
    line(ctx, '#fcf2dd', 1.1, [x-2,y-5], [x+right-2,y-rise-5], [end+right+2,y-rise-5]);
    roofFixture(ctx, x+18, y-10, .84);
    roofFixture(ctx, x+43, y-12, .59);
    if (tall && variant%2) {
      line(ctx, '#465371', 1.2, [end-9,y-12], [end-9,y-29]);
      line(ctx, '#e4d9d0', 1, [end-12,y-24], [end-6,y-24]);
      ellipse(ctx, '#e57976', end-9, y-29, 1.2, 1.2);
    }
  }

  function car(ctx, variant, truck) {
    const [shine, body, shade] = cars[variant];
    const width = truck ? 36 : 33;
    shadow(ctx, 2, 11, width + 7, 14.7);
    for (const x of [-19,21]) {
      ellipse(ctx, '#27243a', x, 9, 7.2, 8.6, -.11);
      ellipse(ctx, '#64728b', x+.4, 10, 4.2, 5.7, -.11);
      ellipse(ctx, '#b9c8d3', x+.8, 10, 2.1, 3.4, -.11);
      for (let i = 0; i < 3; i++) {
        const a = i*Math.PI/1.5;
        line(ctx, '#b9c8d3', .55, [x+.8,10], [x+.8+Math.cos(a)*3.4,10+Math.sin(a)*4.5]);
      }
    }
    polygon(ctx, gradient(ctx, -35, -8, 26, 14, shade, body, shade),
      [-width,-5], [-25,-11], [26,-12], [width,-2], [width,7], [26,12], [27,5], [16,4], [12,13], [-13,13], [-15,5], [-24,4], [-28,10], [-width,6]);
    if (truck) {
      polygon(ctx, gradient(ctx, -33, -31, 4, -4, shine, body, shade), [-36,-27], [3,-28], [3,5], [-34,4]);
      polygon(ctx, '#fff1d1a8', [-36,-27], [-29,-35], [13,-37], [3,-28]);
      polygon(ctx, shade, [3,-28], [13,-37], [13,-3], [3,5]);
      for (let x=-30; x<1; x+=4) line(ctx, '#eee0df4f', .8, [x,-24], [x,1]);
      polygon(ctx, shine, [12,-21], [20,-21], [29,-13], [35,-8], [20,-3], [10,-9]);
      polygon(ctx, '#3e5d79', [14,-19],[20,-19],[27,-13],[16,-12]);
      box(ctx, '#c3d4df', 11, -8, 3, 1.1, .45);
    } else {
      polygon(ctx, gradient(ctx, -22, -33, 20, 3, shine, body, shade), [-33,-7],[-29,-16],[-17,-19],[-10,-29],[9,-29],[20,-16],[28,-15],[33,-5],[26,-.3],[-27,.6]);
      polygon(ctx, '#3b516b', [-15,-17],[-9,-26],[7,-26],[13,-17]);
      polygon(ctx, '#bce0e45f', [-13,-18],[-7,-25],[6,-25],[-2,-19]);
      polygon(ctx, gradient(ctx, -2,-16,15,-1,'#9cc6d2','#2b435d'), [-15,-15],[13,-15],[20,-8],[-19,-7]);
      line(ctx, shade, 1.2, [-2,-14.2],[-2.6,-7.8]);
      polygon(ctx, shine, [12,-23],[16,-21],[25,-14],[20,-12]);
      line(ctx, '#fff0d38c', 1, [-26,-13],[-18,-16],[-10,-28],[4,-28]);
      line(ctx, '#372d4e78', .85, [-30,3],[11,4],[22,2]);
      box(ctx, '#fff0d98f', -9, -4, 4.4, 1.35, .5);
      box(ctx, '#fff0d98f', 6, -4, 4.4, 1.35, .5);
    }
    box(ctx, '#e65362', -width+.9, -2.9, 3.4, 3.1, 1);
    line(ctx, '#ffcfaa', .8, [-width+1.4,-2.2],[-width+3.4,-2.2]);
    box(ctx, '#ffffcc', width-4.8,-3.8, 3.5, 2.7, 1);
    line(ctx, '#ffebd474', 1.25, [width-6,6],[width-1,4]);
  }

  function trunk(ctx) {
    polygon(ctx, '#714e43', [-6,9], [-4,-9], [-5,-30], [2,-36], [4,-15], [7,8], [3,12], [-2,10]);
    polygon(ctx, '#bc8963', [-5,9], [-3,-11], [-4,-24], [0,-31], [1,-12], [1,9]);
    line(ctx, '#6c544240', .8, [-2,-11], [-.9,6], [2,9]);
    line(ctx, '#865c45', 2, [1,-14], [-9,-24], [-15,-26]);
    line(ctx, '#926047', 2, [1,-17], [11,-33], [16,-34]);
    ellipse(ctx, '#9f785340', 1,9,9,4.5);
  }

  function tree(ctx, variant) {
    const [light, middle, dark] = trees[variant];
    shadow(ctx, 6, 9, 32, 10);
    trunk(ctx);
    const crowns = [[2,-35,34,16],[-20,-39,15,15],[24,-41,13,14],[-7,-48,17,18],[17,-54,15,18],[0,-61,15,19],[-19,-58,12,13]];
    for (const [x,y,w,h] of crowns) {
      const highlight = ctx.createRadialGradient(x-w*.28, y-h*.3, 1, x, y, w);
      highlight.addColorStop(0, light);
      highlight.addColorStop(.54, middle);
      highlight.addColorStop(1, dark);
      ellipse(ctx, highlight, x,y,w,h, -.18);
    }
    for (let i = 0; i < 108; i++) {
      const angle = i * 2.39996;
      const distance = Math.sqrt((i+.5)/108);
      const x = Math.cos(angle)*distance*32;
      const y = -52+Math.sin(angle)*distance*25+x*.07;
      const r = 1.5+(i*37%11)*.46;
      ellipse(ctx, i%9===0 ? '#fff5a476' : i%3===0 ? '#21473d4a' : i%2 ? light+'71' : middle+'87', x,y,r,r*.7,angle);
    }
  }

  function lamp(ctx, variant) {
    shadow(ctx, 8, 5, 24, 5.4);
    ellipse(ctx, '#716c7f', -1,5,10,4.6);
    ellipse(ctx, '#a5a2ab', -2,3,8.5,3.9);
    line(ctx, '#555265', 6, [-1,3],[-1,-13]);
    line(ctx, '#444b63', 4, [-1,0],[-1,-63],[1,-69],[8,-72],[18,-72]);
    line(ctx, '#a5acb0', 1.1, [-2,-3],[-2,-62], [1,-70], [9,-73], [17,-73]);
    ellipse(ctx, '#ffe8a433', 20,-69,16,10);
    ellipse(ctx, '#e8e1b4', 20,-69,9.2,4.6);
    ellipse(ctx, '#617092', 20,-72,10.2,4.6);
    ellipse(ctx, '#c3c9ca', 17,-74,5.4,1.6);
    if (variant%2) {
      box(ctx, '#ca6e7b', -1, -52, 17, 17, 1.4);
      polygon(ctx, '#aa5264', [-1,-35],[6,-38],[12,-35],[16,-35],[16,-37],[-1,-37]);
      line(ctx, '#fff1cf', 1.4, [4,-44], [11,-44]);
      line(ctx, '#fff1cf', 1.3, [4,-41], [9,-41]);
    }
  }

  function bench(ctx, variant, theme) {
    shadow(ctx, 1, 8, 34, 11);
    for (const x of [-22,20]) {
      line(ctx, '#53546a', 3.6, [x,8], [x,-8], [x+5,-17], [x+5,-28]);
      line(ctx, '#868397', 1.2, [x-.4,7],[x-.4,-7],[x+4,-17]);
    }
    const wood = variant%2 ? '#508b83' : '#b57054';
    for (let i = 0; i < 3; i++) {
      polygon(ctx, i%2 ? '#d29e7b' : wood, [-27,-26+i*4.8],[26,-26+i*4.8],[26,-23+i*4.8],[-27,-23+i*4.8]);
      line(ctx, theme.trim, .7, [-26,-25.5+i*4.8],[25,-25.5+i*4.8]);
    }
    polygon(ctx, gradient(ctx,-27,-12,26,0,theme.trim,wood), [-24,-12],[30,-12],[23,-3],[-31,-3]);
    line(ctx, '#594552', 1.1, [-31,-3],[23,-3],[30,-12]);
    line(ctx, '#8d6372', .8, [-29,-5.5],[25,-5.5]);
    line(ctx, '#8d6372', .8, [-27,-8.5],[27,-8.5]);
    ellipse(ctx, '#efe1ba', -22,-8.1,1.5,1.1);
    ellipse(ctx, '#efe1ba', 22,-8.1,1.5,1.1);
  }

  function table(ctx, variant, theme) {
    shadow(ctx, 4, 8, 37, 15);
    for (const x of [-25,25]) {
      line(ctx, '#5a435c', 2, [x-5,8],[x-3,-3],[x+4,-3],[x+5,9]);
      ellipse(ctx, '#7e696f', x,-3,10,5);
      ellipse(ctx, '#e3af8c', x-1,-5,8.3,4);
    }
    line(ctx, '#617389', 2.6, [-9,8],[0,2],[10,8]);
    line(ctx, '#72637a', 2.9, [0,8],[0,-42]);
    ellipse(ctx, '#94697b', 0,-5,19,9);
    ellipse(ctx, '#f6c891', 0,-8,19,8);
    ellipse(ctx, '#fff1ca', 2,-8,5.5,3.3);
    ellipse(ctx, '#d5684f', 2,-8,2.7,1.8);
    const top = [-4,-52];
    const end = [[-31,-32],[-22,-26],[-6,-24],[13,-25],[34,-30],[21,-39]];
    for (let i=0; i<end.length-1; i++) {
      polygon(ctx, i%2 ? '#ffe2af' : theme.accent, top, end[i], end[i+1]);
      line(ctx, '#54354a56', .7, top, end[i+1]);
    }
    line(ctx, '#fff1d1ba', 1.1, end[0],end[1],end[2],end[3],end[4]);
    ellipse(ctx, '#ffe7b0', -4,-52,2.6,2.2);
  }

  function planter(ctx, variant) {
    shadow(ctx, 2, 7, 29, 12);
    const [light,middle,dark] = trees[variant];
    polygon(ctx, '#ae674d', [-24,-12],[-18,7],[16,8],[24,-12]);
    polygon(ctx, '#744b5a', [23,-11],[16,8],[7,10],[12,-11]);
    box(ctx, '#e4a27d', -26,-15,51,6,1.8);
    ellipse(ctx, '#604839', -1,-14,25,6.2);
    for (let i = 0; i < 17; i++) {
      const x=(i*13%39)-20, y=-15-(i*17%19), r=4.5+i%5;
      ellipse(ctx, i%3===0 ? dark : i%2===0 ? middle : light, x,y,r,r*.57,i*.65);
      if (i%3===0) ellipse(ctx, i%2 ? '#ffb592' : '#fad267', x+1,y-1,2.7,2.4);
    }
  }

  function cone(ctx, variant) {
    shadow(ctx, 4, 5, 25, 8);
    polygon(ctx, '#52546a', [-23,0], [-12,-7],[12,-7],[22,0],[13,8],[-15,8]);
    polygon(ctx, '#716779', [-23,0], [-16,4],[15,4],[22,0],[13,8],[-15,8]);
    const color = variant%2 ? '#f8bb59' : '#ed8055';
    ellipse(ctx, '#a65645', 0,-.5,15,5.9);
    polygon(ctx, gradient(ctx,-17,-9,12,-10,'#ffe2ad',color,'#b55555'), [-14,-2],[-4,-33],[4,-33],[13,-2],[7,1],[-8,1]);
    polygon(ctx, '#fff0d6', [-8.5,-19],[8.1,-19],[10.7,-11],[-11,-11]);
    polygon(ctx, '#7b515844', [3,-32],[8,-19],[10.7,-11],[13,-2],[6,1],[5,-9]);
    ellipse(ctx, '#ffcb96', .3,-33,3.9,1.5);
  }

  function trash(ctx, variant) {
    shadow(ctx, 3, 8, 28, 11);
    if (variant%2) {
      ellipse(ctx, '#54576e', -9,1,17,12,.13);
      ellipse(ctx, '#62657b', -12,-2,13,10,.13);
      ellipse(ctx, '#777483', -14,-4,6,3,-.2);
      line(ctx, '#b9a7aa7a', 1.2, [-21,0],[-19,-4],[-15,-6]);
      polygon(ctx, '#41455b', [-17,-11],[-22,-17],[-15,-17],[-13,-13],[-6,-16],[-4,-13],[-10,-8]);
      polyTrashPaper(ctx);
      return;
    }
    ellipse(ctx, '#465666', 2,6,20,8);
    polygon(ctx, gradient(ctx,-23,-9,20,-5,'#77958b','#547f73','#385464'), [-21,-17],[19,-17],[17,6], [9,10],[-12,9],[-19,4]);
    for(let i=0;i<5;i++) line(ctx,'#cfddc757',1,[-15+i*6,-13],[-14+i*6,3]);
    ellipse(ctx,'#436575',-1,-18,23,8.1);
    ellipse(ctx,'#8ea497',-2,-20,21,6.3);
    ellipse(ctx,'#a6b2a0',-5,-21,13,3.8);
    box(ctx,'#46596b',-7,-25,10,3.4,1.1);
    polyTrashPaper(ctx);
  }

  function polyTrashPaper(ctx) {
    polygon(ctx, '#eae1bf', [11,6],[26,1],[31,7],[20,13]);
    polygon(ctx, '#fff0ce', [11,6],[20,5],[20,11]);
    line(ctx, '#8b9b9c', .7, [23,6],[28,5]);
    box(ctx, '#d76b63', 25,-4, 9,5,1.7);
    ellipse(ctx, '#f0dec5', 33.8,-1.6,1.65,2.35);
  }

  const painters = {
    trash, cone, planter, bench, table, lamp, tree, house,
    car: (ctx, variant) => car(ctx, variant, false),
    truck: (ctx, variant) => car(ctx, variant, true),
    building: (ctx, variant, theme) => building(ctx, variant, theme, false),
    tower: (ctx, variant, theme) => building(ctx, variant, theme, true)
  };

  function sprite(kind, variant) {
    const key = kind + ':' + variant;
    if (cache.has(key)) return cache.get(key);
    const [x,y,w,h] = spriteSpecs[kind];
    const pixelRatio = 2;
    const canvas = document.createElement('canvas');
    canvas.width = w*pixelRatio;
    canvas.height = h*pixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.translate(-x,-y);
    painters[kind](ctx, variant, palettes[variant]);
    const result = {canvas,x,y,w,h};
    cache.set(key,result);
    return result;
  }

  function draw(ctx, kind, size, variant=0) {
    if (!Object.hasOwn(spriteSpecs, kind) || size <= 0) return;
    const palette = ((Math.trunc(variant) || 0)%palettes.length+palettes.length)%palettes.length;
    const {canvas,x,y,w,h} = sprite(kind,palette);
    const scale = size/36;
    ctx.drawImage(canvas,x*scale,y*scale,w*scale,h*scale);
  }

  window.SGCityArt = {draw};
})();
