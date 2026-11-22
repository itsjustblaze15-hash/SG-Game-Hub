(() => {
  'use strict';

  const T = window.THREE;
  const sphere = new T.SphereGeometry(1, 16, 12);
  const bead = new T.SphereGeometry(1, 8, 6);
  const material = new T.MeshStandardMaterial({vertexColors: true, roughness: .76});
  const hairColors = {
    brown: [0x5b3324, 0x895239, 0x744229, 0x4a271f],
    gold: [0xbe7a29, 0xf6cc6d, 0xdca650, 0xa56823],
    black: [0x28242c, 0x564357, 0x413545, 0x221b27],
    auburn: [0x913b28, 0xcb6942, 0xab4c30, 0x763024]
  };
  const outfitColors = {
    pink: [0xda5688, 0xfb88ad, 0xa63569, 0xffe9a3],
    mint: [0x55a993, 0x81ccad, 0x348675, 0xffedb8],
    lilac: [0x8772bd, 0xb59bdf, 0x6f529d, 0xffeeb6]
  };
  const skin = 0xf2ac7e;
  const skinLight = 0xffbf94;
  const shirt = 0xfff3de;
  const boot = 0xc78357;

  function place(parent, geometry, color, position, scale, rotation = [], temporary = false) {
    const part = new T.Mesh(geometry, material);
    part.userData.color = color;
    part.userData.temporary = temporary;
    part.position.set(...position);
    part.scale.set(...scale);
    if (rotation.length) part.rotation.set(...rotation);
    parent.add(part);
    return part;
  }

  function round(parent, color, position, scale, rotation) {
    return place(parent, Math.max(...scale) <= .075 ? bead : sphere, color, position, scale, rotation);
  }

  function line(parent, color, points, radius, count = 9) {
    const curve = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
    const geometry = new T.TubeGeometry(curve, count, radius, 6, false);
    return place(parent, geometry, color, [0, 0, 0], [1, 1, 1], [], true);
  }

  // Bake each rigid group into a single draw call while keeping the eyes and elbow movable.
  function bake(parts) {
    parts.updateMatrixWorld(true);
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    const normalMatrix = new T.Matrix3();
    const vertex = new T.Vector3();
    const normal = new T.Vector3();
    const tint = new T.Color();
    for (const part of parts.children) {
      const geometry = part.geometry;
      const points = geometry.getAttribute('position');
      const directions = geometry.getAttribute('normal');
      const triangles = geometry.getIndex();
      const offset = positions.length / 3;
      normalMatrix.getNormalMatrix(part.matrixWorld);
      tint.set(part.userData.color);
      for (let index = 0; index < points.count; index++) {
        vertex.fromBufferAttribute(points, index).applyMatrix4(part.matrixWorld);
        normal.fromBufferAttribute(directions, index).applyMatrix3(normalMatrix).normalize();
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
        colors.push(tint.r, tint.g, tint.b);
      }
      for (let index = 0; index < (triangles?.count ?? points.count); index++) {
        indices.push(offset + (triangles ? triangles.getX(index) : index));
      }
      if (part.userData.temporary) geometry.dispose();
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return new T.Mesh(geometry, material);
  }

  function flower(parts, x, y, z, radius, petal, center) {
    for (let i = 0; i < 5; i++) {
      const angle = i * 2 * Math.PI / 5;
      round(parts, petal, [x + Math.sin(angle) * radius, y + Math.cos(angle) * radius, z],
        [radius * .49, radius * .74, radius * .26], [0, 0, -angle]);
    }
    round(parts, center, [x, y, z + radius * .19], [radius * .49, radius * .49, radius * .27]);
  }

  function buildHat(parts, style, accent) {
    const straw = style === 'straw';
    const base = straw ? 0xe3b161 : 0xf6aecc;
    const brim = straw ? 0xf2ca7e : 0xf7cade;
    const band = straw ? accent : 0xb45b87;
    const section = [
      [0, 1.363], [.244, 1.36], [.336, 1.323], [.363, 1.33],
      [.367, 1.347], [.337, 1.365], [.268, 1.386], [.237, 1.412], [.222, 1.491],
      [.193, 1.543], [.13, 1.573], [.055, 1.581], [0, 1.581]
    ].map(([radius, height]) => new T.Vector2(radius, height));
    place(parts, new T.LatheGeometry(section, 32), base, [0, 0, -.03], [1, 1, .91], [], true);
    const bandProfile = [[.241, 1.392], [.24, 1.411], [.238, 1.432], [.232, 1.439]]
      .map(([radius, height]) => new T.Vector2(radius, height));
    place(parts, new T.LatheGeometry(bandProfile, 32), band, [0, 0, -.03], [1, 1, .91], [], true);
    if (straw) {
      for (const [radius, height] of [[.354, 1.354], [.328, 1.369], [.298, 1.377], [.232, 1.449], [.213, 1.504], [.183, 1.548], [.138, 1.571]]) {
        place(parts, new T.TorusGeometry(radius, .0045, 5, 32), brim, [0, height, -.03],
          [1, .91, 1], [Math.PI / 2, 0, 0], true);
      }
      round(parts, band, [-.224, 1.446, .12], [.075, .034, .023], [0, -.55, -.39]);
      round(parts, band, [-.284, 1.413, .093], [.08, .037, .029], [0, -.65, .75]);
      round(parts, 0xe86b99, [-.25, 1.424, .13], [.032, .031, .023]);
      line(parts, band, [[-.252, 1.413, .133], [-.274, 1.367, .157], [-.312, 1.331, .168]], .015);
    } else {
      flower(parts, -.162, 1.452, .171, .044, 0xfff4ee, 0xffcc63);
      flower(parts, -.242, 1.403, .154, .035, 0xfff7dd, 0xffb55f);
      round(parts, 0x73aa68, [-.218, 1.449, .164], [.03, .013, .01], [0, 0, -.65]);
    }
  }

  function createGardenAvatar({hair = 'brown', outfit = 'pink', hat = 'straw', style = 'curls'} = {}) {
    const [hairBase, hairShine, hairMid, hairDeep] = hairColors[hair] || hairColors.brown;
    const [fabric, fabricLight, seam, accent] = outfitColors[outfit] || outfitColors.pink;
    const body = new T.Group();
    for (const side of [-1, 1]) {
      const x = side * .105;
      round(body, 0x9b572d, [x, .03, .041], [.084, .03, .125], [0, side * .13, 0]);
      round(body, boot, [x, .09, .048], [.081, .07, .12], [0, side * .13, 0]);
      round(body, 0xe9af7c, [x, .111, .12], [.059, .04, .06], [0, side * .13, 0]);
      round(body, shirt, [x, .172, .006], [.062, .053, .069]);
      round(body, fabric, [x, .299, 0], [.077, .152, .087], [0, 0, side * .08]);
      round(body, fabricLight, [x + side * .019, .259, .04], [.053, .083, .053]);
      round(body, seam, [x, .207, .006], [.072, .025, .075]);
    }
    round(body, fabric, [0, .438, -.009], [.184, .14, .131]);
    round(body, shirt, [0, .66, -.025], [.178, .196, .119]);
    round(body, fabric, [0, .553, .085], [.153, .155, .051]);
    round(body, fabricLight, [0, .501, .132], [.072, .06, .013]);
    line(body, seam, [[-.057, .522, .139], [-.038, .468, .143], [.033, .468, .145], [.059, .52, .14]], .005);
    for (const side of [-1, 1]) {
      const x = side * .103;
      line(body, fabric, [[x * .52, .812, -.075], [x, .802, .048], [x, .727, .102], [x * .92, .649, .133]], .022);
      round(body, accent, [x * .92, .649, .153], [.02, .02, .009]);
      round(body, skin, [side * .017, .847, 0], [.054, .076, .064]);
    }
    flower(body, 0, .506, .146, .021, 0xfff1e6, 0xf9c951);

    // Soft cheeks, ears and curls are layered around the head.
    round(body, hairDeep, [0, 1.14, -.094], [.256, .276, .207]);
    for (const side of [-1, 1]) {
      const x = side * .195;
      if (style === 'pigtails') {
        round(body, hairBase, [side * .254, 1.029, -.075], [.115, .14, .112], [0, 0, side * .39]);
        round(body, hairMid, [side * .328, .93, -.041], [.101, .115, .081], [0, 0, side * .47]);
        round(body, hairShine, [side * .371, .939, .005], [.035, .07, .037], [0, 0, side * .44]);
        round(body, fabricLight, [side * .259, 1.095, .027], [.044, .024, .018], [0, 0, side * .28]);
        round(body, accent, [side * .268, 1.094, .044], [.018, .021, .013]);
      } else if (style === 'bob') {
        round(body, hairBase, [x, 1.064, -.057], [.095, .133, .12], [0, 0, side * .11]);
        round(body, hairShine, [side * .252, 1.067, .002], [.026, .083, .031], [0, 0, side * .1]);
      } else {
        round(body, hairBase, [x, 1.002, -.074], [.097, .176, .125], [0, 0, side * .18]);
        round(body, hairMid, [x * 1.12, .937, -.021], [.075, .105, .084], [0, 0, side * .28]);
        round(body, hairShine, [x * 1.24, .927, .035], [.024, .043, .031], [0, 0, side * .34]);
      }
      round(body, skin, [side * .213, 1.082, .046], [.047, .057, .035], [0, 0, -side * .22]);
      round(body, 0xe49378, [side * .239, 1.081, .071], [.018, .03, .009]);
    }
    round(body, skinLight, [0, 1.122, .045], [.215, .236, .181]);
    round(body, skinLight, [0, 1.062, .086], [.186, .165, .143]);
    for (const side of [-1, 1]) {
      round(body, 0xf29784, [side * .133, 1.079, .19], [.047, .027, .011], [0, side * .41, 0]);
      for (const [x, y] of [[.121, 1.089], [.143, 1.082], [.126, 1.071]]) {
        round(body, 0xd37562, [side * x, y, .205 - (x - .121) * .65], [.0041, .0041, .003]);
      }
    }
    round(body, 0xf2a282, [0, 1.107, .225], [.023, .020, .017]);
    round(body, 0xffcea7, [-.004, 1.113, .239], [.010, .006, .003]);
    line(body, 0x954432, [[-.042, 1.049, .217], [-.02, 1.034, .226], [.005, 1.031, .23], [.029, 1.041, .224], [.044, 1.052, .217]], .006);
    round(body, hairBase, [0, 1.282, .002], [.232, .139, .184]);
    round(body, hairBase, [-.087, 1.255, .124], [.155, .089, .112], [0, -.21, .59]);
    round(body, hairMid, [-.161, 1.242, .113], [.075, .097, .077], [0, -.31, -.45]);
    round(body, hairMid, [.111, 1.276, .127], [.126, .062, .092], [0, .28, -.54]);
    round(body, hairBase, [.198, 1.233, .092], [.064, .113, .084], [0, .37, .32]);
    line(body, hairShine, [[.088, 1.351, .121], [.03, 1.336, .183], [-.062, 1.308, .215], [-.142, 1.25, .19]], .008);
    line(body, hairShine, [[.107, 1.33, .177], [.154, 1.308, .194], [.185, 1.275, .173]], .006);
    for (const side of [-1, 1]) {
      line(body, hairDeep, [[side * .066, 1.196, .222], [side * .094, 1.203, .216], [side * .12, 1.194, .204]], .008);
    }
    if (hat !== 'none') buildHat(body, hat, fabricLight);

    // The watering arm is still. The other has a small relaxed wave.
    round(body, shirt, [-.179, .724, -.007], [.076, .084, .077], [0, 0, -.32]);
    round(body, skin, [-.215, .641, .006], [.048, .073, .053], [0, 0, -.44]);
    round(body, skinLight, [-.222, .554, .066], [.045, .078, .047], [0, 0, .03]);
    round(body, skin, [-.22, .498, .076], [.047, .047, .04]);

    const wave = new T.Group();
    round(wave, shirt, [.041, -.035, -.008], [.076, .079, .076], [0, 0, .5]);
    round(wave, skin, [.099, -.067, .003], [.076, .041, .045], [0, 0, -.24]);
    round(wave, skinLight, [.16, -.009, .024], [.04, .085, .045], [0, 0, -.14]);
    round(wave, skinLight, [.179, .054, .04], [.047, .039, .025], [0, 0, -.22]);
    for (const [x, y] of [[.146,.089],[.165,.108],[.188,.115],[.211,.101]]) {
      round(wave, skinLight, [x, y, .04], [.011, .029, .013], [0, 0, -.25]);
    }
    round(wave, skin, [.137, .049, .048], [.012, .025, .017], [0, 0, .6]);

    const eyes = new T.Group();
    for (const side of [-1, 1]) {
      const x = side * .088;
      round(eyes, 0xfff7eb, [x, 0, .218], [.032, .041, .011], [0, side * .20, 0]);
      round(eyes, 0x74432d, [x + .004, -.001, .226], [.022, .031, .009]);
      round(eyes, 0x2f2123, [x + .005, -.001, .233], [.015, .024, .006]);
      round(eyes, 0xfff8ee, [x + .001, .011, .239], [.009, .011, .004]);
      round(eyes, 0xffedd5, [x + .014, -.011, .237], [.004, .004, .003]);
      line(eyes, 0x4d2e25, [[x - .028, .017, .222], [x, .037, .225], [x + .027, .019, .221]], .0055);
      line(eyes, 0x4d2e25, [[x + side * .022, .023, .226], [x + side * .035, .033, .225]], .004);
    }

    const avatar = new T.Group();
    const bodyMesh = bake(body);
    const armMesh = bake(wave);
    const eyesMesh = bake(eyes);
    armMesh.position.set(.139, .742, -.005);
    eyesMesh.position.y = 1.144;
    avatar.add(bodyMesh, armMesh, eyesMesh);

    avatar.userData.animate = seconds => {
      const waveCycle = (seconds % 6) / 6;
      const waveWindow = Math.pow(Math.max(0, Math.sin(waveCycle * Math.PI)), 8);
      armMesh.rotation.z = -.18 + waveWindow * (.28 + .24 * Math.sin(seconds * 7));
      const blink = Math.abs((seconds % 4.2) - 3.5);
      eyesMesh.scale.y = .12 + .88 * Math.min(1, blink * 18);
    };
    avatar.userData.dispose = () => {
      for (const mesh of avatar.children) mesh.geometry.dispose();
    };
    return avatar;
  }

  window.createGardenAvatar = createGardenAvatar;
})();
