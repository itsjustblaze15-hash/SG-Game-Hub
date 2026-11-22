(() => {
  'use strict';

  const T = window.THREE;
  const TAU = 2 * Math.PI;
  const ellipsoid = new T.SphereGeometry(1, 16, 12);
  const detailSphere = new T.SphereGeometry(1, 8, 6);
  const colorMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.79 });
  const flowerModels = new Map();

  // Shape each petal around a heavier, rounded tip with a shallow central fold.
  const petal = new T.SphereGeometry(1, 12, 8);
  const petalPositions = petal.getAttribute('position');
  for (let index = 0; index < petalPositions.count; index++) {
    const x = petalPositions.getX(index);
    const y = petalPositions.getY(index);
    const z = petalPositions.getZ(index);
    const taper = 0.74 + 0.26 * y;
    petalPositions.setXYZ(index, x * taper, y, z - 0.25 * Math.abs(x) + 0.23 * y * y);
  }
  petal.computeVertexNormals();

  const leaf = new T.SphereGeometry(1, 12, 8);
  const leafPositions = leaf.getAttribute('position');
  for (let index = 0; index < leafPositions.count; index++) {
    const x = leafPositions.getX(index);
    const y = leafPositions.getY(index);
    const z = leafPositions.getZ(index);
    leafPositions.setXYZ(index, x * (0.86 - 0.21 * y), y, z - 0.3 * Math.abs(x) - 0.32 * y * y);
  }
  leaf.computeVertexNormals();

  function mesh(group, geometry, color, position, scale, rotation = [0, 0, 0]) {
    const part = new T.Mesh(geometry);
    part.userData.color = color;
    part.position.set(...position);
    part.scale.set(...scale);
    part.rotation.set(...rotation);
    group.add(part);
    return part;
  }

  function round(group, color, position, scale, rotation) {
    const geometry = Math.max(...scale) < 0.085 ? detailSphere : ellipsoid;
    return mesh(group, geometry, color, position, scale, rotation);
  }

  function strand(group, color, points, radius, segments = 8) {
    const curve = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
    const geometry = new T.TubeGeometry(curve, segments, radius, 5, false);
    geometry.userData.generated = true;
    mesh(group, geometry, color, [0, 0, 0], [1, 1, 1]);
  }

  // Each rigid part is baked into one colored mesh for mobile draw calls.
  function bake(parts) {
    parts.updateMatrixWorld(true);
    const positions = [];
    const normals = [];
    const colors = [];
    const triangles = [];
    const point = new T.Vector3();
    const normal = new T.Vector3();
    const normalMatrix = new T.Matrix3();
    const color = new T.Color();
    parts.traverse(part => {
      if (!part.isMesh) return;
      const position = part.geometry.getAttribute('position');
      const normalAttribute = part.geometry.getAttribute('normal');
      const indices = part.geometry.getIndex();
      normalMatrix.getNormalMatrix(part.matrixWorld);
      color.set(part.userData.color);
      const vertexOffset = positions.length / 3;
      for (let index = 0; index < position.count; index++) {
        point.fromBufferAttribute(position, index).applyMatrix4(part.matrixWorld);
        normal.fromBufferAttribute(normalAttribute, index).applyMatrix3(normalMatrix).normalize();
        positions.push(point.x, point.y, point.z);
        normals.push(normal.x, normal.y, normal.z);
        colors.push(color.r, color.g, color.b);
      }
      const indexCount = indices ? indices.count : position.count;
      for (let index = 0; index < indexCount; index++) {
        triangles.push(vertexOffset + (indices ? indices.getX(index) : index));
      }
      if (part.geometry.userData.generated) part.geometry.dispose();
    });
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(triangles);
    geometry.computeBoundingSphere();
    const result = new T.Mesh(geometry, colorMaterial);
    result.castShadow = true;
    return result;
  }

  function addLeaf(group, x, y, z, direction, size, shade) {
    const branch = new T.Group();
    branch.position.set(x, y, z);
    branch.rotation.set(0.32, direction * 0.32, direction * 0.92);
    group.add(branch);
    mesh(branch, leaf, shade, [0, size * 0.81, 0], [size * 0.52, size, size * 0.19]);
    strand(branch, 0x86bb42, [[0, 0, 0.007], [0, size * 0.8, size * 0.2],
      [0, size * 1.62, size * 0.052]], 0.007, 5);
  }

  const flowerTypes = {
    daisy: {
      height: 0.92, radius: 0.35, petal: 0xfff6df, petalShade: 0xf6e4d5,
      core: 0xffbf36, speckle: 0xffda63, petals: 12
    },
    sunflower: {
      height: 1.24, radius: 0.45, petal: 0xffd13c, petalShade: 0xffae27,
      core: 0x853e22, speckle: 0xba7231, petals: 14
    },
    cosmos: {
      height: 1.06, radius: 0.41, petal: 0xf587b8, petalShade: 0xf65a9d,
      core: 0xf3b33d, speckle: 0xffe88a, petals: 9
    },
    lavender: {
      height: 1.13, radius: 0.32, petal: 0xcf9bf0, petalShade: 0x9850ca,
      core: 0x7648b2, speckle: 0xebb9fb, petals: 8
    }
  };

  function makeFlower(kind, stage, variant) {
    const parts = new T.Group();
    const palette = flowerTypes[kind] || flowerTypes.daisy;
    if (stage === 0) {
      round(parts, 0xbb7139, [0, 0.073, 0.015], [0.107, 0.067, 0.067], [0, 0, 0.24]);
      round(parts, 0xebad68, [-0.019, 0.111, 0.04], [0.064, 0.014, 0.024], [0, 0, 0.25]);
      return bake(parts);
    }

    const lean = [0, 0.09, -0.1, 0.05][variant];
    const height = stage === 1 ? 0.46 : palette.height * [1, 0.94, 1.06, 0.98][variant];
    strand(parts, 0x4b883d,
      [[0, 0, 0], [lean * 0.34, height * 0.3, 0], [-lean * 0.26, height * 0.65, -0.023], [lean, height, 0]],
      stage === 1 ? 0.022 : 0.033);

    addLeaf(parts, 0, height * 0.27, 0, 1, stage === 1 ? 0.19 : 0.23, 0x609e3c);
    addLeaf(parts, 0, height * 0.43, 0, -1, stage === 1 ? 0.17 : 0.2, 0x76b644);

    if (stage === 1) {
      addLeaf(parts, lean * 0.52, height * 0.72, -0.026, 0.7, 0.125, 0x9bc948);
      return bake(parts);
    }

    addLeaf(parts, -lean * 0.24, height * 0.63, -0.024, 0.73, 0.15, 0x79b846);

    if (kind === 'lavender') {
      for (const [index, offset] of [-0.15, 0, 0.13].entries()) {
        const spikeHeight = height * (index === 1 ? 1.19 : 0.91);
        const bloomX = lean + offset;
        strand(parts, 0x608743, [[0, 0.36, 0.02], [offset * 0.49, 0.68, 0], [bloomX, spikeHeight, 0]], 0.017);
        for (let tier = 0; tier < 5; tier++) {
          const taper = 1 - tier * 0.13;
          for (let bud = 0; bud < 5; bud++) {
            const angle = bud * TAU / 5 + tier * 0.58;
            const y = spikeHeight - 0.26 + tier * 0.069;
            round(parts, (tier + bud) % 3 === 0 ? palette.petalShade : palette.petal,
              [bloomX + Math.cos(angle) * 0.064 * taper, y, Math.sin(angle) * 0.067 * taper],
              [0.057 * taper, 0.078 * taper, 0.053 * taper], [0.28 * Math.sin(angle), 0, 0.24 * Math.cos(angle)]);
          }
        }
      }
      return bake(parts);
    }

    const head = new T.Group();
    head.position.set(lean, height, 0);
    head.rotation.set(-0.88, lean * 2.7, variant * 0.24);
    parts.add(head);

    const size = palette.radius;
    const ringRadius = size * 0.59;
    const isSunflower = kind === 'sunflower';
    const centerSize = size * (isSunflower ? 0.47 : 0.33);

    round(head, 0x568643, [0, 0, -0.067], [centerSize * 1.08, centerSize * 1.08, 0.074]);
    if (isSunflower) {
      for (let index = 0; index < 12; index++) {
        const angle = index * TAU / 12 + 0.18;
        mesh(head, petal, palette.petalShade, [-Math.sin(angle) * ringRadius, Math.cos(angle) * ringRadius, -0.014],
          [0.095, size * 0.47, 0.04], [0.1, 0, angle]);
      }
    }
    for (let index = 0; index < palette.petals; index++) {
      const angle = index * TAU / palette.petals;
      const length = size * (0.47 + 0.03 * Math.cos(index * 2.7));
      const width = size * (kind === 'cosmos' ? 0.35 : 0.21);
      const color = index % 3 === 2 && !isSunflower ? palette.petalShade : palette.petal;
      mesh(head, petal, color, [-Math.sin(angle) * ringRadius, Math.cos(angle) * ringRadius, 0.008],
        [width, length, size * 0.105], [0.16, 0, angle]);
    }
    round(head, palette.core, [0, 0, 0.038], [centerSize, centerSize, size * 0.195]);
    const pollenCount = isSunflower ? 26 : 15;
    for (let dot = 0; dot < pollenCount; dot++) {
      const spin = dot * 2.39996;
      const radial = Math.sqrt(dot / pollenCount) * centerSize * 0.88;
      const z = 0.042 + Math.sqrt(1 - (radial / centerSize) ** 2) * size * 0.18;
      const fleck = size * (isSunflower ? 0.046 : 0.052);
      round(head, palette.speckle, [Math.cos(spin) * radial, Math.sin(spin) * radial, z], [fleck, fleck, fleck * 0.65]);
    }
    return bake(parts);
  }

  function flower(kind, stage = 2, variant = 0) {
    const pose = ((Math.floor(variant) % 4) + 4) % 4;
    const key = [kind, stage, pose].join(':');
    if (!flowerModels.has(key)) flowerModels.set(key, makeFlower(kind, stage, pose));
    const model = new T.Group();
    model.add(flowerModels.get(key).clone());
    return model;
  }

  const cream = 0xfff2dd;
  const white = 0xfffbf1;
  const cocoa = 0x46302d;

  function bunny() {
    const root = new T.Group();
    const animated = new T.Group();
    const parts = new T.Group();
    const ears = [];
    root.add(animated);

    round(parts, cream, [0, 0.25, -0.025], [0.239, 0.265, 0.231], [-0.18, 0, 0]);
    round(parts, white, [0, 0.235, 0.117], [0.173, 0.169, 0.134]);
    round(parts, 0xffeddb, [0, 0.436, 0.077], [0.239, 0.207, 0.206]);
    round(parts, white, [0, 0.143, -0.215], [0.108, 0.105, 0.114]);

    for (const side of [-1, 1]) {
      round(parts, cream, [side * 0.153, 0.075, 0.122], [0.119, 0.077, 0.147], [0, side * 0.2, 0]);
      round(parts, cream, [side * 0.103, 0.204, 0.195], [0.069, 0.086, 0.072], [0.35, 0, 0]);
      round(parts, white, [side * 0.063, 0.385, 0.251], [0.102, 0.075, 0.069]);
      round(parts, 0xf7ad9d, [side * 0.143, 0.393, 0.233], [0.043, 0.025, 0.015], [0, side * 0.43, 0]);
      round(parts, cocoa, [side * 0.098, 0.463, 0.252], [0.028, 0.038, 0.022], [0, side * 0.32, 0]);
      round(parts, white, [side * 0.099 - 0.006, 0.474, 0.273], [0.01, 0.011, 0.005]);
      for (const whisker of [-1, 1]) {
        strand(parts, 0xe1b7a2, [[side * 0.103, 0.381, 0.306],
          [side * 0.153, 0.379 + whisker * 0.008, 0.292], [side * 0.208, 0.38 + whisker * 0.027, 0.269]], 0.0026, 4);
      }

      const ear = new T.Group();
      ear.position.set(side * 0.115, 0.555, 0.05);
      const earParts = new T.Group();
      round(earParts, cream, [0, 0.162, 0], [0.071, 0.198, 0.055]);
      round(earParts, 0xffbba9, [0, 0.172, 0.043], [0.041, 0.144, 0.019]);
      ear.add(bake(earParts));
      animated.add(ear);
      ears.push([ear, side]);
    }
    round(parts, 0xc47763, [0, 0.409, 0.304], [0.029, 0.02, 0.016]);
    strand(parts, cocoa, [[-0.035, 0.365, 0.306], [-0.015, 0.357, 0.314],
      [0, 0.375, 0.316], [0.016, 0.357, 0.314], [0.035, 0.365, 0.306]], 0.005, 8);
    animated.add(bake(parts));
    root.userData.animate = (time, phase = 0) => {
      const angle = time * 2.2 + phase;
      animated.position.y = Math.max(0, Math.sin(angle)) * 0.035;
      for (const [ear, side] of ears) {
        ear.rotation.z = -side * (0.26 + Math.sin(angle + side) * 0.075);
        ear.rotation.x = -0.12 + Math.cos(angle * 0.73 + side) * 0.1;
      }
    };
    root.userData.animate(0);
    return root;
  }

  const butterflyColors = {
    pink: [0x6b2e8d, 0xef86dc, 0xc643b6, 0xffd1ef],
    orange: [0x7b3b23, 0xffc543, 0xf6832f, 0xffe8a3],
    blue: [0x363d9a, 0x74d8ef, 0x5886df, 0xc2f6ff]
  };

  function butterfly(color = 'pink') {
    const root = new T.Group();
    const body = new T.Group();
    const wings = [];
    const [edge, bright, shade, spot] = butterflyColors[color] || butterflyColors.pink;
    round(body, cocoa, [0, 0.043, 0], [0.045, 0.043, 0.141]);
    round(body, edge, [0, 0.05, 0.119], [0.043, 0.04, 0.043]);

    for (const side of [-1, 1]) {
      strand(body, cocoa, [[side * 0.017, 0.07, 0.13], [side * 0.039, 0.097, 0.196], [side * 0.074, 0.125, 0.23]], 0.006, 5);
      round(body, shade, [side * 0.074, 0.125, 0.23], [0.015, 0.015, 0.015]);
      const wing = new T.Group();
      const shape = new T.Group();
      const foreAngle = [0, side * -0.44, 0];
      const hindAngle = [0, side * 0.46, 0];
      round(shape, edge, [side * 0.192, 0.014, 0.087], [0.186, 0.023, 0.111], foreAngle);
      round(shape, edge, [side * 0.157, 0.014, -0.083], [0.142, 0.022, 0.108], hindAngle);
      round(shape, bright, [side * 0.183, 0.024, 0.083], [0.16, 0.018, 0.084], foreAngle);
      round(shape, shade, [side * 0.145, 0.025, -0.08], [0.118, 0.016, 0.078], hindAngle);
      round(shape, spot, [side * 0.257, 0.038, 0.112], [0.042, 0.009, 0.028], foreAngle);
      round(shape, spot, [side * 0.284, 0.038, 0.052], [0.026, 0.008, 0.018], foreAngle);
      round(shape, spot, [side * 0.195, 0.036, -0.118], [0.036, 0.008, 0.026], hindAngle);
      wing.add(bake(shape));
      root.add(wing);
      wings.push([wing, side]);
    }
    root.add(bake(body));
    root.userData.animate = (time, phase = 0) => {
      const flap = 0.54 + 0.65 * Math.sin(time * 20 + phase);
      for (const [wing, side] of wings) wing.rotation.z = side * flap;
    };
    root.userData.animate(0);
    return root;
  }

  function bird() {
    const root = new T.Group();
    const parts = new T.Group();
    const wings = [];
    const blue = 0x478cc8;
    round(parts, blue, [0, 0.183, -0.025], [0.146, 0.135, 0.172], [0.3, 0, 0]);
    round(parts, cream, [0, 0.16, 0.07], [0.118, 0.111, 0.108], [0.25, 0, 0]);
    round(parts, 0x64b6e2, [0, 0.287, 0.077], [0.124, 0.111, 0.107]);
    round(parts, 0x246998, [0, 0.179, -0.191], [0.068, 0.036, 0.133], [0.38, 0, 0]);
    round(parts, 0xf6b84c, [0, 0.258, 0.181], [0.046, 0.024, 0.047]);

    for (const side of [-1, 1]) {
      round(parts, white, [side * 0.049, 0.291, 0.166], [0.042, 0.043, 0.018], [0, side * 0.29, 0]);
      round(parts, cocoa, [side * 0.051, 0.293, 0.181], [0.021, 0.025, 0.012]);
      round(parts, white, [side * 0.051 - 0.005, 0.302, 0.193], [0.007, 0.008, 0.003]);
      round(parts, 0xdd9858, [side * 0.048, 0.024, 0.037], [0.035, 0.025, 0.063]);
      const pivot = new T.Group();
      pivot.position.set(side * 0.112, 0.199, -0.024);
      const feathers = new T.Group();
      round(feathers, 0x377ebc, [side * 0.034, 0, -0.018], [0.059, 0.078, 0.124], [0.34, 0, 0]);
      round(feathers, 0x54a5d5, [side * 0.069, -0.015, -0.03], [0.028, 0.039, 0.078], [0.35, 0, 0]);
      pivot.add(bake(feathers));
      root.add(pivot);
      wings.push([pivot, side]);
    }
    root.add(bake(parts));
    root.userData.animate = (time, phase = 0) => {
      for (const [wing, side] of wings) wing.rotation.z = side * (0.11 + Math.max(0, Math.sin(time * 3 + phase)) ** 8 * 0.34);
    };
    return root;
  }

  window.GardenModels = { flower, bunny, butterfly, bird };
})();
