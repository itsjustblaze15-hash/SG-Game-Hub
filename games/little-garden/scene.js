/* Original garden scenery. Repeated scenery shares meshes through instancing. */
(() => {
  const T = window.THREE;

  function createGardenScene(canvas) {
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    const scene = new T.Scene();
    scene.background = new T.Color(0xbce9f2);
    scene.fog = new T.Fog(0xceebea, 18, 44);
    const camera = new T.OrthographicCamera(-4, 4, 4, -4, .1, 80);
    scene.add(new T.HemisphereLight(0xfff5e0, 0x75975e, 1.85));
    const sun = new T.DirectionalLight(0xffebc7, 2.5);
    sun.position.set(-5, 8, 3);
    scene.add(sun);
    const fill = new T.DirectionalLight(0xffe0eb, .63);
    fill.position.set(5, 4, -6);
    scene.add(fill);

    let seed = 307;
    function random() {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    const range = (min, max) => min + random() * (max - min);
    const box = new T.BoxGeometry(1, 1, 1);
    const round = new T.SphereGeometry(1, 16, 12);
    const pebble = new T.IcosahedronGeometry(1, 1);
    const petal = new T.SphereGeometry(1, 8, 5);
    const foliage = new T.SphereGeometry(1, 10, 7);
    const tube = new T.CylinderGeometry(1, 1, 1, 12);
    const taper = new T.CylinderGeometry(.62, 1, 1, 9);
    const mat = new T.MeshStandardMaterial({ roughness: .9 });
    const batches = new Map();
    const placement = new T.Object3D();
    function model(geometry, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
      if (!batches.has(geometry)) batches.set(geometry, []);
      placement.position.set(x, y, z);
      placement.scale.set(sx, sy, sz);
      placement.rotation.set(rx, ry, rz);
      placement.updateMatrix();
      batches.get(geometry).push({ matrix: placement.matrix.clone(), color });
    }
    function mesh(geometry, material, x, y, z) {
      const object = new T.Mesh(geometry, material);
      object.position.set(x, y, z);
      scene.add(object);
      return object;
    }

    function paintedTexture(base, shades, dashes, width, height) {
      const image = document.createElement('canvas');
      image.width = width;
      image.height = height;
      const context = image.getContext('2d');
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);
      for (let i = 0; i < dashes; i++) {
        context.fillStyle = shades[i % shades.length];
        context.globalAlpha = range(.14, .45);
        context.beginPath();
        context.ellipse(range(0, width), range(0, height), range(.6, 3.8), range(.4, 1.5), range(0, Math.PI), 0, Math.PI * 2);
        context.fill();
      }
      const texture = new T.CanvasTexture(image);
      texture.colorSpace = T.SRGBColorSpace;
      texture.wrapS = T.RepeatWrapping;
      texture.wrapT = T.RepeatWrapping;
      return texture;
    }
    const lawn = paintedTexture('#72ad49', ['#9bc958','#c0cf7b','#52994e','#d2d281'], 2500, 256, 256);
    lawn.repeat.set(14, 14);
    const lawnPlane = mesh(new T.PlaneGeometry(54, 54), new T.MeshStandardMaterial({ map: lawn, roughness: 1 }), 0, -.045, -10);
    lawnPlane.rotation.x = -Math.PI / 2;

    // Gentle baked contact shadows keep the scene grounded without realtime shadow passes.
    const shadeCanvas = document.createElement('canvas');
    shadeCanvas.width = shadeCanvas.height = 64;
    const shadeContext = shadeCanvas.getContext('2d');
    const gradient = shadeContext.createRadialGradient(32, 32, 3, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(35,50,25,.54)');
    gradient.addColorStop(.52, 'rgba(35,50,25,.24)');
    gradient.addColorStop(1, 'rgba(39,60,29,0)');
    shadeContext.fillStyle = gradient;
    shadeContext.fillRect(0, 0, 64, 64);
    const shadowMaterial = new T.MeshBasicMaterial({
      map: new T.CanvasTexture(shadeCanvas), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
    });
    const shadowPlane = new T.PlaneGeometry(1, 1);
    function shade(x, z, width, depth) {
      const shadow = mesh(shadowPlane, shadowMaterial, x, -.03, z);
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.set(width, depth, 1);
    }

    function outline(Shape, width, depth, radius) {
      const x = width / 2;
      const y = depth / 2;
      const path = new Shape();
      path.moveTo(-x + radius, -y);
      path.lineTo(x - radius, -y);
      path.quadraticCurveTo(x, -y, x, -y + radius);
      path.lineTo(x, y - radius);
      path.quadraticCurveTo(x, y, x - radius, y);
      path.lineTo(-x + radius, y);
      path.quadraticCurveTo(-x, y, -x, y - radius);
      path.lineTo(-x, -y + radius);
      path.quadraticCurveTo(-x, -y, -x + radius, -y);
      return path;
    }
    const edge = outline(T.Shape, 2.46, 1.78, .22);
    edge.holes.push(outline(T.Path, 2.13, 1.45, .17));
    const planter = new T.ExtrudeGeometry(edge, { depth: .23, bevelEnabled: true, bevelThickness: .037, bevelSize: .031, bevelSegments: 2, curveSegments: 4 });
    const soilGeometry = new T.ShapeGeometry(outline(T.Shape, 2.16, 1.48, .16), 5);
    const uv = soilGeometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.16 + .5, uv.getY(i) / 1.48 + .5);
    const mulch = paintedTexture('#774832', ['#b37a52','#523724','#96714d','#d5a872'], 2350, 256, 160);
    const soilMaterial = new T.MeshStandardMaterial({ map: mulch, roughness: 1 });
    const rimColors = [0xd98b59, 0xc87a4f, 0xd99a61, 0xc98554, 0xbe7351];
    const plots = [];
    for (const z of [-.8, 1.7]) {
      for (const x of [-3, -1, 1, 3]) {
        shade(x + .1, z + .1, 2.15, 1.95);
        model(planter, 0xb57149, x, .055, z, .7, .8, 1, -Math.PI / 2);
        const soil = mesh(soilGeometry, soilMaterial, x, .29, z);
        soil.rotation.x = -Math.PI / 2;
        soil.scale.set(.7, .8, 1);
        for (let i = 0; i < 6; i++) {
          const offset = (i - 2.5) * .259;
          const jitter = range(-.014, .014);
          const color = rimColors[(i + plots.length) % rimColors.length];
          model(pebble, color, x + offset, .27, z + .636, .166, .105 + jitter, .12);
          model(pebble, color, x + offset, .26, z - .636, .166, .115, .114);
        }
        for (let i = 0; i < 4; i++) {
          const offset = (i - 1.5) * .288;
          const color = rimColors[(i + 2 * plots.length) % rimColors.length];
          model(pebble, color, x - .781, .265, z + offset, .12, .11, .196);
          model(pebble, color, x + .781, .265, z + offset, .12, .11, .196);
        }
        for (let i = 0; i < 32; i++) {
          model(pebble, i % 3 === 0 ? 0xc08e67 : 0x60412c, x + range(-.67, .67), .293, z + range(-.51, .51), range(.015, .055), range(.008, .028), range(.022, .048), 0, range(0, Math.PI));
        }
        plots.push(new T.Vector3(x, .32, z));
      }
    }

    // A narrow path leaves each planter open from the front and along the center.
    for (let i = 0; i < 22; i++) {
      const x = (i % 2 - .5) * .25 + range(-.045, .045);
      const z = -4.125 + i * .444;
      model(pebble, [0xdcc698, 0xe3cca1, 0xd5ba93][i % 3], x, -.017, z, range(.265, .345), .049, range(.19, .26), 0, range(-.4, .4));
    }

    const picketShape = new T.Shape();
    picketShape.moveTo(-.5, 0);
    picketShape.lineTo(.5, 0);
    picketShape.lineTo(.5, .83);
    picketShape.lineTo(0, 1);
    picketShape.lineTo(-.5, .83);
    picketShape.closePath();
    const picket = new T.ExtrudeGeometry(picketShape, { depth: .13, bevelEnabled: true, bevelSize: .026, bevelThickness: .025, bevelSegments: 1 });
    function fence(start, end, z, rotation = 0) {
      const length = end - start;
      const count = Math.ceil(length / .34);
      const along = Math.cos(rotation);
      const back = -Math.sin(rotation);
      for (let i = 0; i < count; i++) {
        const step = start + (i + .5) * length / count;
        model(picket, i % 3 ? 0xf8e6d7 : 0xfff4df, step * along, 0, z + step * back, .213, .97 + .07 * Math.sin(i), .7, 0, rotation);
      }
      for (const y of [.27, .69]) {
        const middle = (start + end) / 2;
        model(box, 0xe5c4a5, middle * along, y, z + middle * back, length, .105, .083, 0, rotation);
      }
    }
    const fenceZ = -3.18;
    fence(-6.1, -.56, fenceZ);
    fence(.56, 6.1, fenceZ);
    for (const x of [-5.45,-3.74,-.56,.56,3.36,5.45]) {
      model(box, 0xffecd5, x, .52, fenceZ + .028, .139, 1.04, .16);
      model(pebble, 0xffeedc, x, 1.06, fenceZ + .028, .106, .105, .101);
    }
    for (let i = 0; i < 7; i++) {
      const x = -5.05 + i * 1.67;
      if (Math.abs(x) < .63) continue;
      model(round, 0x709e52, x, .24, fenceZ - .49, .88, .49, .41);
    }

    // Cottage wall and gables are solid shapes with real tiled roof rows.
    const cottageX = -1.7;
    const cottageZ = -5.98;
    shade(cottageX + .22, cottageZ + .15, 5.7, 3.85);
    model(box, 0xf5d6b6, cottageX, .92, cottageZ, 3.18, 1.94, 2.58);
    model(box, 0xcfb08b, cottageX, .12, cottageZ, 3.25, .23, 2.67);
    const gableShape = new T.Shape();
    gableShape.moveTo(-1.59, 0);
    gableShape.lineTo(1.59, 0);
    gableShape.lineTo(0, 1.17);
    gableShape.closePath();
    const gable = new T.ExtrudeGeometry(gableShape, { depth: 2.58, bevelEnabled: false });
    model(gable, 0xf7d9bb, cottageX, 1.89, cottageZ - 1.29, 1, 1, 1);
    for (const side of [-1, 1]) {
      model(box, 0xb6506d, cottageX + side * .937, 2.48, cottageZ, 2.15, .11, 2.9, 0, 0, -side * .633);
      for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 9; column++) {
          const across = .145 + row * .26;
          const x = cottageX + side * across * .8;
          const z = cottageZ - 1.31 + column * .32 + (row % 2 ? .035 : 0);
          const y = 3.245 - across * .59;
          model(box, [0xe87689, 0xd8627f, 0xdf6e86, 0xe88b97][(row + column * 3) % 4], x, y, z, .289, .056, .304, 0, 0, -side * .633);
        }
      }
    }
    for (let i = 0; i < 12; i++) {
      model(round, 0xeb8c9b, cottageX, 3.16, cottageZ - 1.35 + i * .247, .105, .055, .14);
    }
    model(box, 0xda966b, cottageX + .98, 2.75, cottageZ - .52, .39, 1.03, .383);
    model(box, 0xe2ad82, cottageX + .98, 3.26, cottageZ - .52, .48, .11, .46);
    for (let row = 0; row < 6; row++) {
      const y = .37 + row * .247;
      model(box, 0xebbd97, cottageX, y, cottageZ + 1.293, 3.16, .025, .013);
    }
    const front = cottageZ + 1.32;
    function cottageWindow(x, y) {
      model(box, 0xb97762, x, y, front + .035, .626, .656, .115);
      model(box, 0xffefd6, x, y, front + .099, .56, .58, .051);
      model(box, 0x71bacc, x, y, front + .132, .438, .463, .026);
      model(box, 0xe5f4ed, x - .077, y + .104, front + .151, .074, .15, .008, 0, 0, -.44);
      model(box, 0xffeed5, x, y, front + .163, .475, .034, .021);
      model(box, 0xffeed5, x, y, front + .164, .031, .475, .019);
      for (const sign of [-1, 1]) {
        model(box, 0xd67782, x + sign * .385, y, front + .051, .133, .54, .077, 0, sign * .16);
        for (let i = 0; i < 4; i++) model(box, 0xef9a9e, x + sign * .385, y -.16 + i * .1, front + .096, .108, .021, .009);
      }
      model(box, 0xb87e58, x, y - .36, front + .103, .59, .142, .218);
      for (let i = 0; i < 6; i++) {
        model(round, 0x578d4f, x + (i - 2.5) * .078, y - .27, front + .137, .073, .062, .066);
        model(round, i % 2 ? 0xeab4a5 : 0xf4788c, x + (i - 2.5) * .078, y - .21, front + .16, .033, .034, .034);
      }
    }
    cottageWindow(cottageX - .98, 1.04);
    cottageWindow(cottageX + .98, 1.04);
    model(box, 0xc58a69, cottageX, .66, front + .018, .75, 1.32, .095);
    model(box, 0x6aafa4, cottageX, .66, front + .077, .635, 1.24, .05);
    for (let i = 0; i < 4; i++) model(box, 0x59968d, cottageX - .239 + i * .157, .66, front + .111, .017, 1.18, .01);
    model(round, 0xffd995, cottageX + .22, .66, front + .13, .055, .048, .045);
    model(box, 0xdfbd95, cottageX, .078, front + .206, .95, .149, .42);
    model(tube, 0xb97863, cottageX, 2.42, front + .039, .282, .1, .282, Math.PI / 2);
    model(tube, 0x89cad4, cottageX, 2.42, front + .097, .222, .03, .222, Math.PI / 2);
    model(box, 0xffe5c5, cottageX, 2.42, front + .115, .39, .029, .033);
    model(box, 0xffe5c5, cottageX, 2.42, front + .115, .029, .39, .033);

    function branch(a, b, size, color) {
      const from = new T.Vector3(...a);
      const to = new T.Vector3(...b);
      const axis = to.clone().sub(from);
      const rotation = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), axis.clone().normalize());
      const angles = new T.Euler().setFromQuaternion(rotation);
      const center = from.addScaledVector(axis, .5);
      model(taper, color, center.x, center.y, center.z, size, axis.length() + .075, size, angles.x, angles.y, angles.z);
    }
    function tree(x, z, scale, bloom) {
      shade(x + .37, z + .15, scale * 3.9, scale * 2.7);
      branch([x, 0, z], [x - .17 * scale, 2.3 * scale, z], .22 * scale, 0x91603c);
      branch([x -.05 * scale, .85 * scale, z], [x + .79 * scale, 2.38 * scale, z -.18], .132 * scale, 0x9d6b45);
      branch([x -.11 * scale, 1.03 * scale, z], [x - .93 * scale, 2.35 * scale, z + .18], .112 * scale, 0xa27345);
      const colors = bloom ? [0xe990ad, 0xf3a0b8, 0xed81a2, 0xf7b5c4] : [0x8fbb4e, 0x70a352, 0x9bc96b, 0x68a258];
      const crowns = [[-.84,2.43,.15,1], [.66,2.55,.12,.95], [0,2.95,-.12,1.14], [.34,2.72,.54,.83], [-.62,2.84,-.51,.81]];
      for (const [cx,cy,cz,r] of crowns) {
        model(round, colors[Math.floor(random() * colors.length)], x + cx * scale, cy * scale, z + cz * scale, r * scale, r * .75 * scale, r * .88 * scale, .26, random());
        for (let i = 0; i < 14; i++) {
          const angle = range(0, Math.PI * 2);
          const radius = range(.51, .86);
          const tx = x + (cx + Math.cos(angle) * radius * r) * scale;
          const tz = z + (cz + Math.sin(angle) * radius * r * .87) * scale;
          const ty = (cy + range(.18, .51) * r) * scale;
          model(foliage, colors[i % colors.length], tx, ty, tz, range(.12,.36) * scale, range(.12,.27) * scale, range(.14,.33) * scale);
          if (bloom && i % 2 === 0) {
            model(petal, 0xffcfdb, tx + .045, ty + .04, tz + .18 * scale, .079 * scale, .059 * scale, .049 * scale);
            model(petal, 0xffdc87, tx + .048, ty + .042, tz + .219 * scale, .026 * scale, .025 * scale, .018 * scale);
          }
        }
      }
    }
    tree(2.37, -4.78, .995, true);
    tree(-4.76, -4.33, 1.13, true);
    tree(5.88, -5.7, 1.12, false);
    tree(-7, -5.57, 1.08, false);
    tree(4.58, -8.6, 1.39, false);
    tree(-3.4, -10.7, 1.36, false);
    for (let i = 0; i < 13; i++) {
      model(round, [0x81aa66,0x9cbd72,0xa4c77c][i % 3], -16 + i * 2.72, -.8, -15 - random() * 5, range(2.5,4), range(2.9,4.7), range(2,3.5));
    }

    function tuft(x, z, scale) {
      for (let i = 0; i < 3; i++) {
        model(petal, [0x649750,0x7fa549,0x9cba57][i], x + (i - 1) * scale * .12, scale * .11, z + range(-.09,.09), scale * .046, scale * range(.12,.23), scale * .055, .3, 0, (1 - i) * .44);
      }
    }
    function wildflower(x, z, tint, height) {
      const lean = range(-.17,.17);
      model(taper, 0x658e47, x, height * .5, z, .025, height, .026, 0, 0, lean);
      model(petal, 0x84ad53, x + .063, height * .42, z + .015, .097, .034, .042, 0, -.2, .45);
      const centerX = x - Math.sin(lean) * height * .5;
      for (let k = 0; k < 5; k++) {
        const angle = k * Math.PI * .4;
        model(petal, tint, centerX + Math.cos(angle) * .084, height + .018, z + Math.sin(angle) * .084, .076, .027, .043, .17, -angle, 0);
      }
      model(petal, 0xffd16a, centerX, height + .036, z, .058, .033, .056);
    }
    for (let i = 0; i < 106; i++) {
      const x = range(-7.5,7.5);
      const z = range(-3.02,6.5);
      if (!plots.some(plot => Math.abs(x - plot.x) < .95 && Math.abs(z - plot.z) < .85)) tuft(x, z, range(.55, 1.22));
    }
    const colors = [0xed8bb3,0xf6c6c8,0xffebc5,0xc19ae9,0xffbc66];
    for (const [bedX, bedZ] of [[-4.2,-2.02],[4.4,-2.17],[-5.05,2.65],[4.95,1.19],[-3.65,3.65],[3.75,4.23]]) {
      shade(bedX, bedZ, 1.63, 1.13);
      model(round, 0x6a9e4d, bedX, .093, bedZ, .46, .18, .43);
      for (let i = 0; i < 9; i++) {
        wildflower(bedX + range(-.45,.45), bedZ + range(-.36,.36), colors[i % colors.length], range(.18,.43));
      }
    }
    for (let i = 0; i < 8; i++) {
      const x = i < 4 ? -3.32 + range(-.39,.39) : 3.26 + range(-.33,.33);
      model(pebble, [0xc7b697,0xe2cda7,0xa8b29b][i % 3], x, range(.025,.065), range(-2.8,3), range(.11,.26), range(.09,.18), range(.11,.23), 0, range(0,3));
    }

    // A little yellow watering can rests by the path.
    const canX = -2.69;
    const canZ = 5.13;
    shade(canX + .04, canZ, .85, .67);
    model(tube, 0xf7ba48, canX, .19, canZ, .235, .346, .206);
    model(round, 0xf7ca57, canX, .093, canZ, .239, .089, .211);
    const canRim = new T.TorusGeometry(.174, .025, 7, 18);
    model(canRim, 0xffd05c, canX, .37, canZ, 1, .82, 1, Math.PI / 2);
    model(tube, 0xbc7d2f, canX, .342, canZ, .172, .028, .142);
    const canHandle = new T.TorusGeometry(.171, .022, 7, 18, Math.PI);
    model(canHandle, 0xfac951, canX + .015, .337, canZ, 1.13, 1, 1);
    branch([canX + .18,.19,canZ + .015],[canX + .51,.37,canZ + .053],.058,0xf6c14c);
    model(tube, 0xffd46a, canX + .529, .376, canZ + .056, .082, .057, .082, .08, 0, -1.13);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      model(petal, 0xfbe0e3, canX + Math.cos(angle)*.047, .199 + Math.sin(angle)*.047, canZ+.205, .033, .036, .018);
    }
    model(petal, 0xfeab5d, canX, .199, canZ+.219,.029,.029,.016);

    // A terracotta table and a glazed blue vase for flowers picked by the player.
    const vaseX = 4.05;
    const vaseZ = 3.43;
    const vase = new T.Vector3(vaseX, .85, vaseZ);
    shade(vaseX, vaseZ, 1.47, 1.12);
    for (const x of [-.27,.25]) {
      for (const z of [-.2,.2]) model(box, 0x9d654e, vaseX + x, .198, vaseZ + z, .102, .41, .098, 0, 0, -.12 * Math.sign(x));
    }
    model(tube, 0xbc8059, vaseX, .405, vaseZ, .52, .101, .415);
    model(tube, 0xe2ac72, vaseX, .461, vaseZ, .51, .046, .405);
    const profile = [[.007,0],[.092,0],[.122,.039],[.164,.133],[.153,.203],[.106,.256],[.105,.322],[.128,.352],[.126,.369],[.097,.37],[.075,.332],[.082,.272],[.115,.17],[.093,.053],[.007,.036]];
    const vaseGeometry = new T.LatheGeometry(profile.map(([x,y]) => new T.Vector2(x,y)), 22);
    model(vaseGeometry, 0x5ea2b1, vaseX, .482, vaseZ, 1, 1, 1);
    const glazeRing = new T.TorusGeometry(.123, .012, 8, 24);
    model(glazeRing, 0xaccbd1, vaseX, .831, vaseZ, 1, 1, 1, Math.PI / 2);
    model(glazeRing, 0x82b6b7, vaseX, .577, vaseZ, 1.25, 1.25, 1, Math.PI / 2);

    for (const [geometry, instances] of batches) {
      const group = new T.InstancedMesh(geometry, mat, instances.length);
      instances.forEach(({ matrix, color }, index) => {
        group.setMatrixAt(index, matrix);
        group.setColorAt(index, new T.Color(color));
      });
      group.computeBoundingSphere();
      scene.add(group);
    }

    shade(-4.25, 1.5, 1.42, 1.02);
    const clouds = [];
    const cloudMaterial = new T.MeshStandardMaterial({ color: 0xfffbef, roughness: 1 });
    for (const [x,y,z] of [[-8,5.6,-14],[3.1,6,-16],[11,4.8,-13]]) {
      const cloud = new T.Group();
      cloud.position.set(x,y,z);
      for (let p = 0; p < 4; p++) {
        const puff = new T.Mesh(round, cloudMaterial);
        puff.position.set(p * .78, p === 1 ? .43 : 0, range(-.18,.18));
        puff.scale.set(.97, p === 1 ? .74 : .48, .53);
        cloud.add(puff);
      }
      scene.add(cloud);
      clouds.push({ cloud, x });
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const decorations = new Map();
    const decorMaterial = new T.MeshStandardMaterial({ roughness: .78 });
    const torus = new T.TorusGeometry(1, .11, 8, 28);
    let area = 'garden';
    let ownedDecor = new Set();
    let lastSeconds = 0;

    function decoration(id, build) {
      const root = new T.Group();
      const parts = new Map();
      function part(geometry, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
        if (!parts.has(geometry)) parts.set(geometry, []);
        placement.position.set(x, y, z);
        placement.scale.set(sx, sy, sz);
        placement.rotation.set(rx, ry, rz);
        placement.updateMatrix();
        parts.get(geometry).push({ matrix: placement.matrix.clone(), color });
      }
      build(part);
      for (const [geometry, instances] of parts) {
        const object = new T.InstancedMesh(geometry, decorMaterial, instances.length);
        instances.forEach(({matrix, color}, index) => {
          object.setMatrixAt(index, matrix);
          object.setColorAt(index, new T.Color(color));
        });
        object.computeBoundingSphere();
        root.add(object);
      }
      root.visible = false;
      scene.add(root);
      decorations.set(id, root);
      return root;
    }

    decoration('birdbath', part => {
      const x = 4.85, z = 1.1;
      part(tube, 0xe3c594, x, .08, z, .4, .16, .34);
      part(taper, 0xdbc8ab, x, .4, z, .16, .65, .16);
      part(round, 0xf5d2b0, x, .75, z, .47, .09, .41);
      part(torus, 0xf6dfbc, x, .79, z, .43, .38, .26, Math.PI / 2);
      part(tube, 0x7ac3cf, x, .79, z, .35, .018, .30);
      part(torus, 0xd2f2ed, x, .808, z, .18, .15, .08, Math.PI / 2);
    });
    decoration('house', part => {
      const x = -4.86, z = -2.02;
      part(box, 0xf4cd9b, x, .3, z, .74, .6, .59);
      part(round, 0xf8debb, x, .3, z + .31, .34, .3, .025);
      part(round, 0x635447, x, .245, z + .345, .14, .215, .012);
      part(box, 0xd19f6d, x, .03, z + .42, .47, .055, .28);
      for (const side of [-1, 1]) {
        part(box, 0xd57e9b, x + side * .2, .7, z, .55, .065, .76, 0, 0, -side * .65);
      }
      part(petal, 0xffecd0, x + .25, .32, z + .34, .08, .08, .025);
      part(petal, 0xffbd55, x + .25, .32, z + .37, .035, .035, .018);
      part(tube, 0xb87f62, x + .32, .29, z + .02, .07, .14, .07, Math.PI/2);
    });
    const lanternGroup = decoration('lanterns', part => {
      for (const [x,z] of [[-2.9,3.8],[0,3.75],[2.9,3.8]]) {
        part(tube, 0xa8775b, x, .45, z, .027, .9, .027);
        part(tube, 0xbd8865, x, .83, z, .22, .06, .22);
        part(round, 0xffd78b, x, 1, z, .17, .22, .17);
        part(torus, 0xeab176, x, 1.15, z, .15, .15, .17, Math.PI / 2);
        part(torus, 0xeab176, x, .85, z, .15, .15, .17, Math.PI / 2);
        part(tube, 0xeeb76f, x, 1.2, z, .025, .08, .025);
      }
    });

    const pondX = 4.55, pondZ = -.95;
    const pond = decoration('pond', part => {
      part(round, 0xb9b598, pondX, -.005, pondZ, 1.08, .1, .9);
      part(round, 0x6eacbc, pondX, .045, pondZ, .96, .07, .78);
      part(round, 0x91d3d7, pondX - .08, .075, pondZ, .79, .015, .58);
      for (let i = 0; i < 18; i++) {
        const angle = i * Math.PI / 9;
        part(pebble, [0xc4ba99,0xe1ccaa,0xb9c5a2][i % 3], pondX + Math.cos(angle), .1, pondZ + Math.sin(angle) * .83, .18, .09, .13, 0, angle);
      }
      for (const [x,z] of [[-.34,.3],[.42,-.15],[-.2,-.38]]) {
        part(tube, 0x91b666, pondX + x, .101, pondZ + z, .17, .012, .14);
        for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3;
          part(petal, 0xf3a5c1, pondX + x + Math.cos(angle) * .065, .15, pondZ + z + Math.sin(angle) * .065, .085, .035, .04, 0, -angle);
        }
        part(petal, 0xffdc83, pondX + x, .165, pondZ + z, .04, .025, .04);
      }
      for (const [x,z] of [[-.8,-.3],[.8,.3],[.45,-.7]]) {
        for (let i = 0; i < 3; i++) {
          const dx = (i - 1) * .07;
          part(taper, 0x72985a, pondX + x + dx, .26, pondZ + z, .012, .47 + i * .04, .013, 0, 0, dx);
          part(tube, 0xa16a48, pondX + x + dx, .49 + i * .025, pondZ + z, .027, .11, .027);
        }
      }
    });
    const ripples = [];
    const rippleMaterial = new T.MeshBasicMaterial({color: 0xd7f4ed, transparent: true, opacity: .56});
    for (let i = 0; i < 2; i++) {
      const ripple = new T.Mesh(torus, rippleMaterial);
      ripple.position.set(pondX + .28, .13 + i * .002, pondZ + .14);
      ripple.rotation.x = -Math.PI / 2;
      pond.add(ripple);
      ripples.push(ripple);
    }

    const patch = decoration('butterfly', part => {
      const x = -4.85, z = -.75;
      part(round, 0x7eab5b, x, .005, z, .97, .11, .93);
      for (let i = 0; i < 15; i++) {
        const angle = i * 2.399;
        const radius = .22 + (i % 4) * .17;
        const px = x + Math.cos(angle) * radius;
        const pz = z + Math.sin(angle) * radius;
        const height = .28 + (i % 3) * .13;
        part(tube, 0x5d9452, px, height / 2, pz, .018, height, .018);
        const color = [0xc299df,0xf5b2d2,0xffd894][i % 3];
        for (let j = 0; j < 5; j++) {
          const theta = j * Math.PI * .4;
          part(petal, color, px + Math.cos(theta) * .07, height, pz + Math.sin(theta) * .07, .075, .03, .044, 0, -theta);
        }
        part(petal, 0xffe8a3, px, height + .025, pz, .035, .022, .035);
      }
      part(box, 0xcba079, x, .23, z - .75, .64, .1, .16);
      for (const side of [-1,1]) part(box, 0xba8a67, x + side * .24, .1, z - .75, .055, .2, .055);
    });
    const fluttering = [];
    for (let i = 0; i < 3; i++) {
      const butterfly = new T.Group();
      const body = new T.Mesh(new T.SphereGeometry(.025, 6, 4), new T.MeshStandardMaterial({color:0x8f6558}));
      body.scale.set(1,2.4,1);
      butterfly.add(body);
      const wings = [];
      const color = [0xffc86c,0xd6a2eb,0xa3dce4][i];
      const wingMaterial = new T.MeshStandardMaterial({color, roughness:.8, side:T.DoubleSide});
      for (const side of [-1,1]) {
        const wing = new T.Group();
        const top = new T.Mesh(petal, wingMaterial);
        top.position.set(side * .09,.045,0);
        top.scale.set(.12,.13,.018);
        top.rotation.z = -side * .38;
        const bottom = new T.Mesh(petal, wingMaterial);
        bottom.position.set(side * .068,-.07,0);
        bottom.scale.set(.085,.092,.015);
        wing.add(top,bottom);
        butterfly.add(wing);
        wings.push({wing,side});
      }
      patch.add(butterfly);
      fluttering.push({butterfly,wings});
    }

    const areaWash = new T.Mesh(new T.PlaneGeometry(32,30), new T.MeshBasicMaterial({color:0xaed7c2, transparent:true, opacity:.12, depthWrite:false}));
    areaWash.rotation.x = -Math.PI / 2;
    areaWash.position.set(0,-.043,-4);
    areaWash.visible = false;
    scene.add(areaWash);
    function setDecor(ownedIds = []) {
      ownedDecor = new Set(ownedIds.map(id => String(id).replace(/^decor[:\-]/,'')));
      for (const [id, group] of decorations) group.visible = ownedDecor.has(id);
      if (!ownedDecor.has(area)) area = 'garden';
      setArea(area);
    }
    function setArea(next) {
      area = ['pond','butterfly'].includes(next) && ownedDecor.has(next) ? next : 'garden';
      areaWash.visible = area !== 'garden';
      areaWash.material.color.set(area === 'pond' ? 0xa0d4e4 : 0xf7c3e1);
      areaWash.material.opacity = area === 'garden' ? 0 : .17;
      scene.background.set(area === 'pond' ? 0xc1e8ed : area === 'butterfly' ? 0xf5dfeb : 0xbce9f2);
      pond.scale.setScalar(1);
      patch.scale.setScalar(1);
      return area;
    }

    const heartShape = new T.Shape();
    heartShape.moveTo(0,.02);
    heartShape.bezierCurveTo(-.17,.22,-.29,.02,0,-.19);
    heartShape.bezierCurveTo(.29,.02,.17,.22,0,.02);
    const heartGeometry = new T.ShapeGeometry(heartShape,10);
    const particleMaterial = new T.MeshBasicMaterial({side:T.DoubleSide});
    const particleGeometry = new T.SphereGeometry(1,7,5);
    const particleMesh = new T.InstancedMesh(particleGeometry,particleMaterial,48);
    const heartMesh = new T.InstancedMesh(heartGeometry,particleMaterial,18);
    particleMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    heartMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    particleMesh.frustumCulled = heartMesh.frustumCulled = false;
    scene.add(particleMesh,heartMesh);
    const particles = Array.from({length:48},()=>({life:0,start:0,kind:'',origin:new T.Vector3(),velocity:new T.Vector3(),size:0}));
    const hearts = Array.from({length:18},()=>({life:0,start:0,kind:'',origin:new T.Vector3(),velocity:new T.Vector3(),size:0}));
    const hiddenMatrix = new T.Matrix4().makeScale(0,0,0);
    for (let i=0;i<48;i++) particleMesh.setMatrixAt(i,hiddenMatrix);
    for (let i=0;i<18;i++) heartMesh.setMatrixAt(i,hiddenMatrix);
    let particleCursor = 0;
    let heartCursor = 0;
    function celebrate(position, kind = 'bloom') {
      if (reducedMotion.matches || !position) return;
      const heart = kind === 'heart';
      const pool = heart ? hearts : particles;
      const target = heart ? heartMesh : particleMesh;
      const count = heart ? 5 : kind === 'water' ? 13 : 10;
      const palette = kind === 'water' ? [0x91ddf1,0xc8f4fc,0x6dc5e0] : kind === 'pick' ? [0xffde83,0xffc761,0xfff1bc] : [0xf6a6cb,0xcbb2f0,0xffe6a3];
      for (let i=0;i<count;i++) {
        const index = heart ? heartCursor++ % pool.length : particleCursor++ % pool.length;
        const particle = pool[index];
        const angle = i * 2.399;
        const spread = kind === 'water' ? .3 : .5;
        particle.start = lastSeconds;
        particle.life = kind === 'water' ? .7 : 1.1;
        particle.kind = kind;
        particle.origin.copy(position);
        particle.origin.y += kind === 'water' ? 1.25 : .5;
        particle.origin.x += Math.cos(angle) * (kind === 'water' ? .2 : .06);
        particle.origin.z += Math.sin(angle) * .12;
        particle.velocity.set(Math.cos(angle)*spread,kind === 'water' ? -1.2 : .9 + (i%3)*.15,Math.sin(angle)*spread);
        particle.size = heart ? .44 : kind === 'water' ? .055 : .045 + (i%3)*.015;
        target.setColorAt(index,new T.Color(heart ? 0xf39fbc : palette[i%palette.length]));
      }
      target.instanceColor.needsUpdate = true;
    }
    function updateParticles(pool, target, seconds) {
      for (let index=0;index<pool.length;index++) {
        const particle = pool[index];
        const elapsed = seconds - particle.start;
        if (!particle.life || elapsed >= particle.life || reducedMotion.matches) {
          particle.life=0;
          target.setMatrixAt(index,hiddenMatrix);
          continue;
        }
        const progress = Math.max(0,elapsed) / particle.life;
        placement.position.copy(particle.origin).addScaledVector(particle.velocity,elapsed);
        if (particle.kind==='water') placement.position.y -= elapsed*elapsed*.8;
        else placement.position.y -= elapsed*elapsed*.3;
        const scale = particle.size * Math.sin(Math.PI * Math.min(.98,progress+.02));
        placement.scale.set(scale,scale*(particle.kind==='water'?1.6:1),scale);
        placement.rotation.set(0,0,particle.kind==='heart'?Math.sin(elapsed*2)*.12:elapsed*2);
        placement.updateMatrix();
        target.setMatrixAt(index,placement.matrix);
      }
      target.instanceMatrix.needsUpdate = true;
    }

    function resize(width, height) {
      width = Math.max(1, width || canvas.clientWidth);
      height = Math.max(1, height || canvas.clientHeight);
      const aspect = width / height;
      const vertical = Math.max(7.5, 12.2 / aspect);
      const horizontal = vertical * aspect;
      camera.left = -horizontal / 2;
      camera.right = horizontal / 2;
      camera.top = vertical / 2;
      camera.bottom = -vertical / 2;
      camera.position.set(.3, height < 360 ? 10.5 : 9.7, 12.8);
      camera.lookAt(0, .57, -.12);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      renderer.setSize(width, height, false);
    }
    function update(seconds) {
      if (!Number.isFinite(seconds)) seconds = lastSeconds;
      if (seconds < lastSeconds) {
        for (const particle of [...particles,...hearts]) particle.life = 0;
      }
      lastSeconds = seconds;
      const animatedSeconds = reducedMotion.matches ? 0 : seconds;
      updateParticles(particles,particleMesh,animatedSeconds);
      updateParticles(hearts,heartMesh,animatedSeconds);
      ripples.forEach((ripple,index) => {
        const cycle = (animatedSeconds * .35 + index * .5) % 1;
        ripple.scale.setScalar(.07 + cycle * .34);
      });
      fluttering.forEach(({butterfly,wings},index) => {
        const theta = animatedSeconds * (.48 + index * .07) + index * 2.1;
        butterfly.position.set(-4.85 + Math.cos(theta) * .53, .8 + index*.11 + Math.sin(theta*2)*.15, -.75 + Math.sin(theta)*.59);
        butterfly.rotation.y = -theta;
        for (const {wing,side} of wings) wing.rotation.y = side * Math.sin(animatedSeconds * 13 + index) * .65;
      });
      lanternGroup.rotation.y = Math.sin(animatedSeconds*.65)*.003;
      for (let i = 0; i < clouds.length; i++) {
        clouds[i].cloud.position.x = clouds[i].x + Math.sin(animatedSeconds * .13 + i * 1.9) * .58;
      }
    }
    resize(canvas.clientWidth, canvas.clientHeight);
    return {
      renderer, scene, camera, plots, vase, update, resize, setDecor, setArea, celebrate,
      avatarSpot: new T.Vector3(-4.25, 0, 1.5),
      rabbitSpot: new T.Vector3(-4.37, 0, 3.1),
      squirrelSpot: new T.Vector3(4.45, 0, 2.2),
      ladybugSpot: new T.Vector3(-2.65, .32, 2.6),
      birdSpot: new T.Vector3(3.36, 1.17, -3.05),
    };
  }

  window.createGardenScene = createGardenScene;
})();
