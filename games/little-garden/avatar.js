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
    lilac: [0x8772bd, 0xb59bdf, 0x6f529d, 0xffeeb6],
    peach: [0xf2a37e, 0xffc39a, 0xcc775a, 0xffefd0],
    sky: [0x62aeda, 0xa0d9f0, 0x3f80b1, 0xffdf83],
    rose: [0xcf4674, 0xf38fab, 0x9c315b, 0xfaf0cd],
    lemon: [0xe2bd43, 0xffdf79, 0xb38d28, 0xffffff],
    berry: [0xa84b8e, 0xd88fc3, 0x75346e, 0xffd5df],
    meadow: [0x6b9b55, 0xa9cb83, 0x46733e, 0xfde8a0],
    ocean: [0x388eae, 0x77bfd0, 0x24647c, 0xd7f0e7],
    coral: [0xe3746b, 0xffaaa0, 0xb04e55, 0xffe6c4],
    plum: [0x77518e, 0xa685b6, 0x583a72, 0xf7dce8],
    sunflower: [0xe7ac32, 0xffd15c, 0xad7821, 0x79482b],
    strawberry: [0xd95569, 0xf38f9e, 0x9e3552, 0x7aab5b],
    rainbow: [0x6aa6cd, 0x9acadd, 0x4e7a9d, 0xffd277],
    daisy: [0xf1e8c8, 0xfff9df, 0xb7aa80, 0xedb637],
    denim: [0x4c7ea5, 0x7fa6c2, 0x315c7c, 0xd8a65c],
    lavender: [0xa887c5, 0xcbb1df, 0x79599b, 0xece7b5],
    buttercup: [0xc4ad45, 0xe8d47b, 0x8e7d29, 0xffffff],
    woodland: [0x987251, 0xc09c77, 0x6a4d36, 0xb8d08b]
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

  const hatTints = {
    bow: 0xe885aa, bee: 0xf2c34f, sunflower: 0xf1c443, strawberry: 0xdf667a,
    rainbow: 0x91c8df, bunny: 0xe8d6cc, kitty: 0xc3a8c7, beret: 0xa477b7,
    cap: 0x76aeb9, daisy: 0xf5edcf, leaf: 0x8fb56c, crown: 0xefce66,
    moon: 0x7088bb, mushroom: 0xe38c7a, butterfly: 0xc792cd, pom: 0xb0c6dc,
    bonnet: 0xf3c2ca
  };

  function hatBand(parts, tint, radius = .23) {
    place(parts, new T.TorusGeometry(radius, .023, 7, 28), tint,
      [0, 1.345, -.02], [1, .91, 1], [Math.PI / 2, 0, 0], true);
  }

  function themedHat(parts, style, accent) {
    const tint = hatTints[style] || accent;
    if (['bow', 'leaf', 'crown', 'butterfly'].includes(style)) {
      hatBand(parts, tint);
      if (style === 'bow') {
        round(parts, tint, [-.14, 1.407, .155], [.091, .052, .026], [0, -.25, -.42]);
        round(parts, tint, [-.27, 1.397, .1], [.084, .052, .03], [0, -.45, .45]);
        round(parts, 0xf8b5c7, [-.204, 1.397, .149], [.033, .037, .03]);
      } else if (style === 'crown') {
        for (let i = 0; i < 5; i++) {
          const x = (i - 2) * .071;
          place(parts, new T.ConeGeometry(.04, .12, 5), tint,
            [x, 1.425 - Math.abs(i - 2) * .013, .155], [1, 1, .5], [], true);
          round(parts, [0xe68eae, 0x7bb8c9, 0xc39ade][i % 3], [x, 1.456 - Math.abs(i - 2) * .014, .175], [.015, .018, .009]);
        }
      } else if (style === 'leaf') {
        for (let i = 0; i < 5; i++) {
          round(parts, i % 2 ? 0xa2c878 : 0x719e53, [(i - 2) * .065, 1.39 + Math.sin(i) * .018, .171],
            [.052, .025, .014], [0, 0, (i % 2 ? 1 : -1) * .55]);
        }
      } else {
        const x = -.17, y = 1.421, z = .17;
        for (const side of [-1, 1]) {
          round(parts, 0xca89cc, [x + side * .049, y + .027, z], [.049, .063, .012], [0, 0, side * -.45]);
          round(parts, 0xf3bad8, [x + side * .04, y - .029, z], [.039, .039, .012], [0, 0, side * .45]);
        }
        round(parts, 0x77517a, [x, y, z + .013], [.012, .056, .012]);
      }
      return;
    }
    if (style === 'beret') {
      round(parts, tint, [0, 1.414, -.035], [.294, .11, .232], [0, 0, -.14]);
      round(parts, 0x80559a, [.045, 1.52, -.035], [.018, .027, .018]);
      hatBand(parts, 0x80559a);
      return;
    }
    const cap = ['bee', 'bunny', 'kitty', 'cap', 'moon', 'pom'].includes(style);
    round(parts, tint, [0, cap ? 1.39 : 1.421, -.025], [cap ? .255 : .283, cap ? .16 : .144, .223]);
    if (!['bunny', 'kitty', 'pom'].includes(style)) {
      round(parts, tint, [0, 1.321, cap ? .153 : -.023], [cap ? .22 : .35, .024, cap ? .145 : .29]);
    }
    hatBand(parts, style === 'moon' ? 0xffdfa0 : accent);
    if (style === 'bee') {
      for (const x of [-.093, 0, .093]) {
        line(parts, 0x66503d, [[x, 1.38, .189], [x, 1.45, .185], [x, 1.513, .1]], .012);
      }
      for (const side of [-1, 1]) {
        line(parts, 0x66503d, [[side * .12, 1.51, 0], [side * .16, 1.65, -.01]], .008);
        round(parts, 0x66503d, [side * .16, 1.651, -.01], [.022, .023, .022]);
      }
    } else if (style === 'bunny') {
      for (const side of [-1, 1]) {
        round(parts, tint, [side * .11, 1.64, -.032], [.062, .18, .047], [0, 0, side * -.14]);
        round(parts, 0xf3b6c2, [side * .11, 1.649, .006], [.031, .124, .012], [0, 0, side * -.14]);
      }
    } else if (style === 'kitty') {
      for (const side of [-1, 1]) {
        place(parts, new T.ConeGeometry(.083, .16, 3), tint, [side * .18, 1.558, -.031], [1, 1, .72], [0, side * .1, side * -.2], true);
        place(parts, new T.ConeGeometry(.044, .085, 3), 0xe7bad1, [side * .18, 1.555, .017], [1, 1, .2], [0, 0, side * -.2], true);
      }
    } else if (style === 'pom') {
      round(parts, 0xf0e8de, [0, 1.584, -.036], [.078, .073, .07]);
      for (let i = 0; i < 7; i++) round(parts, 0xffffff, [Math.cos(i) * .05, 1.59 + Math.sin(i) * .04, -.005], [.023, .025, .025]);
    } else if (style === 'moon') {
      round(parts, 0xffdf8f, [-.12, 1.407, .18], [.047, .051, .013]);
      round(parts, tint, [-.098, 1.423, .192], [.039, .041, .013]);
    } else if (style === 'strawberry') {
      for (const x of [-.1, 0, .1]) {
        for (const y of [1.38, 1.46]) round(parts, 0xffe69c, [x, y, .184 - Math.abs(x) * .22], [.008, .015, .005]);
      }
      for (let i = 0; i < 5; i++) round(parts, 0x79a355, [Math.cos(i * 1.26) * .065, 1.56, -.025 + Math.sin(i * 1.26) * .057], [.073, .014, .029], [0, i * 1.26, .2]);
    } else if (style === 'mushroom') {
      for (const [x, y, z] of [[-.13, 1.48, .14], [.1, 1.52, .11], [.2, 1.409, .112], [-.04, 1.552, .08]]) {
        round(parts, 0xffedcd, [x, y, z], [.036, .016, .026], [.3, 0, 0]);
      }
    } else if (style === 'rainbow') {
      const colors = [0xef94ac, 0xf2c474, 0xc1d481, 0x7cb5d7];
      colors.forEach((color, index) => {
        place(parts, new T.TorusGeometry(.071 - index * .012, .009, 6, 15, Math.PI), color, [-.09, 1.407, .207], [1, 1, 1], [], true);
      });
    } else if (style === 'sunflower' || style === 'daisy') {
      flower(parts, -.15, 1.42, .168, .054, style === 'daisy' ? 0xfff8db : 0xffd154, style === 'daisy' ? 0xf1bb3b : 0x8e562c);
    } else if (style === 'bonnet') {
      for (let i = 0; i < 11; i++) {
        const angle = Math.PI * i / 10;
        round(parts, 0xffe5e3, [Math.cos(angle) * .259, 1.34 + Math.sin(angle) * .19, .157], [.034, .03, .035]);
      }
      line(parts, tint, [[-.21, 1.31, .1], [-.16, 1.026, .181], [0, .96, .19], [.14, 1.05, .17], [.2, 1.3, .1]], .012);
    }
  }

  function buildHat(parts, style, accent) {
    if (style !== 'straw' && style !== 'flower') {
      themedHat(parts, style, accent);
      return;
    }
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
    const dress = ['peach', 'rose', 'berry', 'daisy', 'lavender', 'buttercup'].includes(outfit);
    const apron = ['meadow', 'sunflower', 'strawberry', 'woodland'].includes(outfit);
    if (dress) {
      const skirt = new T.CylinderGeometry(.162, .265, .252, 24, 1, false);
      place(body, skirt, fabric, [0, .351, .005], [1, 1, .69], [], true);
      place(body, new T.TorusGeometry(.259, .014, 6, 28), fabricLight,
        [0, .231, .005], [1, .69, 1], [Math.PI / 2, 0, 0], true);
      for (const side of [-1, 1]) round(body, fabricLight, [side * .135, .455, .137], [.05, .023, .018], [0, 0, side * .35]);
    }
    if (apron) {
      place(body, new T.CylinderGeometry(.136, .204, .26, 16), fabricLight,
        [0, .382, .043], [1, 1, .61], [], true);
      round(body, accent, [0, .376, .168], [.071, .045, .009]);
      line(body, seam, [[-.068, .393, .175], [-.061, .349, .181], [.06, .349, .181], [.068, .393, .175]], .004);
    }
    if (outfit === 'sky' || outfit === 'denim') {
      for (const side of [-1, 1]) {
        line(body, fabricLight, [[side * .142, .34, .077], [side * .148, .27, .081], [side * .143, .22, .079]], .006);
        round(body, accent, [side * .15, .47, .085], [.012, .012, .008]);
      }
    }
    if (outfit === 'rainbow') {
      for (const [index, color] of [0xec8baa, 0xf4c86c, 0x9fbd72, 0x8ca5d1].entries()) {
        line(body, color, [[-.115, .69 - index * .027, .128], [0, .68 - index * .027, .148], [.115, .69 - index * .027, .128]], .012);
      }
    } else if (outfit === 'strawberry') {
      for (const x of [-.07, .07]) {
        round(body, 0xe35a6e, [x, .536, .155], [.029, .034, .012]);
        round(body, 0x68a254, [x, .569, .158], [.028, .009, .012], [0, 0, -.2]);
        round(body, 0xffe58d, [x, .533, .17], [.004, .006, .003]);
      }
    } else if (outfit === 'sunflower') {
      flower(body, 0, .55, .158, .037, 0xffd445, 0x81512e);
    } else if (outfit === 'rose' || outfit === 'berry') {
      for (const x of [-.12, 0, .12]) {
        flower(body, x, .31 + Math.abs(x) * .23, .17 - Math.abs(x) * .1, .019, 0xffdbdf, 0xffe294);
      }
      flower(body, -.075, .63, .15, .024, 0xffdbe1, 0xffd36d);
    } else if (outfit === 'woodland') {
      round(body, 0x7ba159, [0, .574, .16], [.045, .02, .012], [0, 0, -.55]);
      line(body, 0xe8d0a0, [[-.02, .544, .174], [0, .563, .174], [.025, .594, .174]], .004);
    } else {
      flower(body, 0, .506, .146, .021, 0xfff1e6, 0xf9c951);
    }

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
