(() => {
  'use strict';

  window.createGardenResidents = function createGardenResidents(world) {
    const T = window.THREE;
    const catalog = GardenEconomy.animals;
    const definitions = new Map(catalog.map(animal => [animal.id, animal]));
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const group = new T.Group();
    group.name = 'Animal homes';
    world.scene.add(group);

    const homes = new Map();
    const residentMaterial = new T.MeshStandardMaterial({vertexColors: true, roughness: .85});
    const rigidBases = new Set(['cat', 'fox', 'turtle', 'frog', 'duck', 'bee', 'hedgehog']);

    function bakeRigidAnimal(source) {
      source.updateMatrixWorld(true);
      const positions = [];
      const normals = [];
      const colors = [];
      const indices = [];
      const vertex = new T.Vector3();
      const normal = new T.Vector3();
      const matrix = new T.Matrix3();
      source.traverse(mesh => {
        if (!mesh.isMesh) return;
        const geometry = mesh.geometry;
        const points = geometry.getAttribute('position');
        const directions = geometry.getAttribute('normal');
        const tint = mesh.material.color;
        const triangles = geometry.getIndex();
        const offset = positions.length / 3;
        matrix.getNormalMatrix(mesh.matrixWorld);
        for (let index = 0; index < points.count; index++) {
          vertex.fromBufferAttribute(points, index).applyMatrix4(mesh.matrixWorld);
          normal.fromBufferAttribute(directions, index).applyMatrix3(matrix).normalize();
          positions.push(vertex.x, vertex.y, vertex.z);
          normals.push(normal.x, normal.y, normal.z);
          colors.push(tint.r, tint.g, tint.b);
        }
        for (let index = 0; index < (triangles?.count ?? points.count); index++) {
          indices.push(offset + (triangles ? triangles.getX(index) : index));
        }
      });
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      const model = new T.Group();
      const mesh = new T.Mesh(geometry, residentMaterial);
      mesh.userData.collectionGeometry = true;
      model.add(mesh);
      model.userData.animate = seconds => { model.rotation.z = Math.sin(seconds * 1.8) * .025; };
      return model;
    }
    // Each family lives in a different part of the original garden.
    // Positions are curated individually so the lawn stays informal and open.
    const sites = {
      butterfly: [
        [-4.9,.85,-.7,.2], [-6.25,1.1,-1.85,-.3], [-7.25,.65,-.4,.5],
        [-5.7,.55,1.35,-.3], [-7.3,1.05,1.25,.2], [-6.8,.8,2.7,-.4]
      ],
      rabbit: [
        [-4.45,0,3.12,.35], [-5.65,0,3.75,-.4], [-4.75,0,5,.2],
        [-6.8,0,4.9,.6], [-5.75,0,6.1,-.25], [-4.5,0,7.2,-.2]
      ],
      bird: [
        [3.36,1.17,-3.05,.2], [-1.9,1.02,-3.10,-.4], [-3.74,1.18,-3.05,.6],
        [5.9,.78,-2.15,-.6], [4.88,.83,1.1,-.4], [-6.2,1.25,-2.95,.5]
      ],
      squirrel: [
        [3.95,.13,3.1,-.45], [-6.95,.42,3.6,.5], [-7.45,.5,5.85,.6], [-6.45,.48,7.7,-.3]
      ],
      ladybug: [
        [-2.65,.34,2.9,.38], [2.35,.26,3.2,-.5], [-.15,.3,3.55,.2], [4.15,.22,-2.12,-.3]
      ],
      cat: [
        [-3.2,.1,5.75,.5], [-1.7,.24,6.5,-.4], [-.4,0,5.8,.2],
        [1.5,.1,7.1,-.5], [2.9,.28,5.8,.45]
      ],
      fox: [
        [5.25,0,4.85,-.5], [6.65,.1,5.5,-.7], [7.9,.06,4.75,-.6], [4.75,.05,6.7,-.4]
      ],
      turtle: [[5.55,.11,-.55,.4], [6.75,.1,3.95,-.5], [7.9,.12,1.6,.6]],
      duck: [[6,.06,1.5,-.45], [7,.06,.15,.5], [7.25,.06,2.8,-.3]],
      frog: [[5.35,.1,3.3,.3], [7.6,.1,-1.1,-.5], [4.8,.1,2,.5]],
      hedgehog: [[-3.2,0,7.5,.4], [-1.15,0,7.8,-.2], [.15,.12,7.4,.4]],
      bee: [[-4.3,.8,-1.9,.3], [-5.9,1.15,0,-.5], [-3.9,.7,4.1,.4]]
    };
    const familySizes = {
      butterfly: [.31,.35], ladybug: [.17,.24], bee: [.23,.4],
      bird: [.24,.5], rabbit: [.36,.83], squirrel: [.34,.75],
      cat: [.35,.81], fox: [.36,.78], turtle: [.34,.42],
      duck: [.29,.63], frog: [.29,.46], hedgehog: [.31,.48]
    };
    const positions = new Map();
    const nextSite = new Map();
    for (const definition of catalog) {
      const ordinal = nextSite.get(definition.base) || 0;
      positions.set(definition.id, sites[definition.base][ordinal]);
      nextSite.set(definition.base, ordinal + 1);
    }

    const scenery = new Map();
    const sphere = new T.SphereGeometry(1,10,7);
    const logGeometry = new T.CylinderGeometry(1,1,1,12);
    const sprigGeometry = new T.ConeGeometry(1,1,7);
    const sceneryMaterial = new T.MeshStandardMaterial({roughness: .92});
    const placement = new T.Object3D();

    function buildHabitat(id, build) {
      const root = new T.Group();
      root.name = id + ' habitat';
      const batches = new Map();
      function part(geometry, color, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) {
        if(!batches.has(geometry)) batches.set(geometry,[]);
        placement.position.set(x,y,z);
        placement.scale.set(sx,sy,sz);
        placement.rotation.set(rx,ry,rz);
        placement.updateMatrix();
        batches.get(geometry).push({matrix:placement.matrix.clone(),color});
      }
      build(part,root);
      for(const [geometry,parts] of batches) {
        const batch=new T.InstancedMesh(geometry,sceneryMaterial,parts.length);
        parts.forEach(({matrix,color},index)=>{
          batch.setMatrixAt(index,matrix);
          batch.setColorAt(index,new T.Color(color));
        });
        batch.computeBoundingSphere();
        root.add(batch);
      }
      root.visible=false;
      scenery.set(id,root);
      group.add(root);
    }

    function bush(part,x,z,scale=1) {
      for(const [dx,dz,size] of [[-.17,.06,.28],[.14,-.05,.31],[.04,.19,.24]]) {
        part(sphere,0x94b36d,x+dx*scale,.16*scale,z+dz*scale,size*scale,.18*scale,size*.8*scale);
      }
    }
    function flowerPatch(part,x,z,tint,count=6) {
      for(let i=0;i<count;i++) {
        const angle=i*2.399;
        const distance=.12+(i%3)*.12;
        const px=x+Math.cos(angle)*distance;
        const pz=z+Math.sin(angle)*distance;
        const height=.18+(i%3)*.065;
        part(logGeometry,0x679155,px,height/2,pz,.012,height,.012);
        for(let petal=0;petal<5;petal++) {
          const theta=petal*Math.PI*.4;
          part(sphere,tint,px+Math.cos(theta)*.052,height,pz+Math.sin(theta)*.052,.056,.019,.035,0,-theta);
        }
        part(sphere,0xffdd76,px,height+.017,pz,.025,.016,.025);
      }
    }
    function fallenLog(part,x,z,length,angle=0,height=.12) {
      part(logGeometry,0xa88360,x,height,z,.115,length,.115,0,angle,Math.PI/2);
      const dx=Math.cos(angle)*length/2;
      const dz=-Math.sin(angle)*length/2;
      for(const side of [-1,1]) {
        part(logGeometry,0xdcc59b,x+side*dx,height,z+side*dz,.087,.018,.087,0,angle,Math.PI/2);
      }
    }

    buildHabitat('rabbit',part=>{
      for(const [x,z] of [[-5.1,3.0],[-6.4,3.6],[-5.4,5.0],[-6.4,6.0],[-4.2,7.05]]) bush(part,x,z,.8);
      for(const [x,z] of [[-4.6,3.75],[-6.9,5.7],[-5.15,6.8]]) flowerPatch(part,x,z,0xeeb4cd,4);
    });
    buildHabitat('butterfly',part=>{
      for(const [x,z,tint] of [[-4.9,-.7,0xebadd0],[-6.25,-1.85,0xc7afe5],[-7.25,-.4,0xffd68a],[-5.7,1.35,0xf2b8c6],[-7.3,1.25,0xc9a3df],[-6.8,2.7,0xffd68a]]) flowerPatch(part,x,z,tint,7);
    });
    buildHabitat('bee',part=>{
      for(const [x,z] of [[-4.3,-1.9],[-5.9,0],[-3.9,4.1]]) flowerPatch(part,x,z,0xffdc78,6);
    });
    buildHabitat('ladybug',part=>{
      for(const [x,z] of [[-2.65,2.9],[2.35,3.2],[-.15,3.55],[4.15,-2.12]]) flowerPatch(part,x,z,0xe7a6c1,5);
    });
    buildHabitat('squirrel',part=>{
      for(const [x,y,z] of [[3.95,.13,3.1],[-6.95,.42,3.6],[-7.45,.5,5.85],[-6.45,.48,7.7]]) {
        part(logGeometry,0xb88c60,x,y/2-.02,z,.21,y+.03,.19,0,.2);
        part(logGeometry,0xe0c89d,x,y-.015,z,.19,.026,.18);
        for(const side of [-1,1]) part(logGeometry,0x936c4d,x+side*.12,y/2-.02,z+.13,.012,y*.7,.014,0,0,side*.12);
      }
      bush(part,-7.8,4.7,.9);
    });
    buildHabitat('bird',part=>{
      // The first three birds use the existing fence; the others perch on branches and a shore stone.
      fallenLog(part,5.9,-2.15,.8,-.22,.71);
      part(logGeometry,0xb18d64,5.75,.34,-2.17,.05,.75,.05,0,0,.2);
      fallenLog(part,-6.2,-2.95,.9,.3,1.18);
      part(logGeometry,0xb18d64,-6.37,.58,-2.87,.065,1.2,.065,0,0,-.17);
      part(sphere,0xb8bf9a,4.88,.4,1.1,.22,.42,.20);
    });
    buildHabitat('cat',part=>{
      fallenLog(part,-1.7,6.5,.95,.3,.13);
      fallenLog(part,2.9,5.8,.9,-.4,.17);
      part(sphere,0xc5bea3,-3.2,.04,5.75,.25,.065,.23);
      part(sphere,0xd5ccb5,1.5,.04,7.1,.24,.065,.22);
      bush(part,-2.45,5.2,.65);
      flowerPatch(part,.5,6.3,0xf4c4ce,4);
    });
    buildHabitat('fox',part=>{
      for(const [x,z] of [[5.0,5.6],[6.8,6.2],[7.6,5.8],[4.6,7.3]]) bush(part,x,z,.9);
      for(const [x,z] of [[6.65,5.5],[7.9,4.75],[4.75,6.7]]) part(sphere,0xc6bd9b,x,.015,z,.25,.07,.23);
    });
    buildHabitat('hedgehog',part=>{
      fallenLog(part,-2.5,8.0,1.1,.27,.11);
      fallenLog(part,.15,7.4,.85,-.3,.05);
      for(const [x,z] of [[-3.5,7.0],[-.8,8.1],[.7,7.8]]) bush(part,x,z,.65);
    });

    buildHabitat('water',(part,root)=>{
      const outline=new T.Shape();
      outline.moveTo(-1.15,-1.15);
      outline.bezierCurveTo(-1.8,-.7,-1.65,.15,-1.4,.65);
      outline.bezierCurveTo(-1.22,1.35,-.45,1.7,.22,1.62);
      outline.bezierCurveTo(.95,1.9,1.74,1.1,1.64,.31);
      outline.bezierCurveTo(1.92,-.2,1.5,-1.23,.7,-1.37);
      outline.bezierCurveTo(.2,-1.85,-.66,-1.65,-1.15,-1.15);
      const geometry=new T.ShapeGeometry(outline,16);
      const bank=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xc5c39e,roughness:1}));
      bank.rotation.x=-Math.PI/2;
      bank.position.set(6.4,.005,1.6);
      bank.scale.set(1.09,1.09,1.09);
      const water=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0x88c4cc,roughness:.38}));
      water.rotation.x=-Math.PI/2;
      water.position.set(6.4,.016,1.6);
      root.add(bank,water);
      for(const [x,z,sx,sz] of [[5.55,-.55,.34,.3],[6.75,3.95,.36,.28],[7.9,1.6,.32,.29],[5.35,3.3,.29,.27],[7.6,-1.1,.32,.3],[4.8,2,.34,.3]]) {
        part(sphere,0xb8c6a4,x,.015,z,sx,.09,sz);
      }
      for(const [x,z] of [[5.3,.8],[6.9,2.5],[7.2,1.2]]) {
        part(sphere,0x9cbd74,x,.035,z,.2,.018,.16);
        flowerPatch(part,x+.05,z-.04,0xf3bed1,1);
      }
      for(const [x,z] of [[5.0,1.1],[7.9,.5],[6.25,3.6],[7.5,-.8]]) {
        for(let i=0;i<3;i++)part(sprigGeometry,0x7f9b58,x+(i-1)*.06,.15,z,.025,.33+i*.04,.025,0,0,(i-1)*.15);
      }
    });

    const sparkMaterial=new T.MeshBasicMaterial({color:0xffdda1,transparent:true,opacity:.9});
    const sparkGeometry=new T.OctahedronGeometry(.055,0);
    const focusSparks=new T.Group();
    focusSparks.name='A little sparkle over the selected friend';
    for(let i=0;i<3;i++)focusSparks.add(new T.Mesh(sparkGeometry,sparkMaterial));
    focusSparks.visible=false;
    group.add(focusSparks);
    let selected;
    let lastTime=0;

    function homePosition(definition) {
      const [x,y,z]=positions.get(definition.id);
      return new T.Vector3(x,y,z);
    }

    function createResident(definition, index) {
      const original = GardenCollectionModels.animal(definition);
      const model = rigidBases.has(definition.base) ? bakeRigidAnimal(original) : original;
      const envelope = new T.Box3();
      // Account for blinking, waving, flapping and tail movement before assigning a home.
      for (let sample = 0; sample <= 16; sample++) {
        model.userData.animate?.(sample * .31, index * .7);
        model.updateMatrixWorld(true);
        envelope.union(new T.Box3().setFromObject(model));
      }
      model.userData.animate?.(0, index * .7);
      const size = envelope.getSize(new T.Vector3());
      const center = envelope.getCenter(new T.Vector3());
      const footprintRadius = Math.hypot(size.x, size.z) / 2;
      const [familyRadius,familyHeight]=familySizes[definition.base];
      const scale = Math.min(familyRadius / Math.max(.001, footprintRadius), familyHeight / Math.max(.001, size.y));
      const grounded = new T.Group();
      grounded.scale.setScalar(scale);
      const centered = new T.Group();
      centered.position.set(-center.x, -envelope.min.y, -center.z);
      centered.add(model);
      grounded.add(centered);

      const resident = new T.Group();
      const position = homePosition(definition);
      resident.position.copy(position);
      resident.rotation.y = positions.get(definition.id)[3];
      resident.add(grounded);
      resident.name = definition.name + ' home';
      resident.userData.animalId = definition.id;
      resident.userData.homeIndex = index;
      resident.userData.homeRadius = familySizes[definition.base][0];
      resident.userData.habitat = definition.base;
      group.add(resident);

      const home = {
        id: definition.id,
        index,
        position,
        radius: familySizes[definition.base][0],
        model,
        root: resident,
        scale,
        phase: index * .7
      };
      homes.set(definition.id, home);
      return home;
    }

    function sync(ids = []) {
      const owned = new Set(ids);
      for (let index = 0; index < catalog.length; index++) {
        const definition = catalog[index];
        if (owned.has(definition.id) && !homes.has(definition.id)) createResident(definition, index);
      }
      for(const [family,root] of scenery) {
        root.visible=family==='water'
          ? [...homes.keys()].some(id=>['duck','frog','turtle'].includes(definitions.get(id).base))
          : [...homes.keys()].some(id=>definitions.get(id).base===family);
      }
      group.userData.residentIds = [...homes.keys()];
      group.userData.residentCount = homes.size;
      return homes.size;
    }

    function focus(id) {
      if (!definitions.has(id) || !homes.has(id)) return false;
      selected = id;
      const home = homes.get(id);
      focusSparks.position.set(home.position.x,home.position.y+.8,home.position.z);
      focusSparks.visible=true;
      update(lastTime);
      return true;
    }

    function update(seconds) {
      lastTime = Number.isFinite(seconds) ? seconds : lastTime;
      const time = reducedMotion.matches ? 0 : lastTime;
      for (const home of homes.values()) {
        home.model.userData.animate?.(time, home.phase);
        const isFlying = ['butterfly', 'bee'].includes(definitions.get(home.id).base);
        home.root.position.y = home.position.y + (isFlying ? Math.sin(time * 2 + home.phase) * .035 : 0);
      }
      if(selected && focusSparks.visible) {
        focusSparks.children.forEach((spark,index)=>{
          spark.position.set((index-1)*.16,.04+Math.sin(time*2+index)*.07,.03*Math.cos(time+index));
          spark.rotation.y=time*.4+index;
          spark.scale.setScalar(.7+Math.sin(time*2+index)*.2);
        });
      }
    }

    const bounds = new T.Box3(
      new T.Vector3(-8.3, 0, -3.7),
      new T.Vector3(8.5, 1.8, 8.4)
    );
    function getHomes() {
      return new Map(homes);
    }

    return {sync, update, focus, getHomes, bounds, group};
  };
})();
