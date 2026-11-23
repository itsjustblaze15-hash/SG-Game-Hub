(() => {
  const T = window.THREE;
  const materials = new Map();
  const sphere = new T.SphereGeometry(1, 14, 10);
  const cone = new T.ConeGeometry(1, 1, 12);
  function material(color) {
    if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({color, roughness:.85}));
    return materials.get(color);
  }
  function part(group, shape, color, position, scale, rotation = 0) {
    const mesh = new T.Mesh(shape, material(color));
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.rotation.z = rotation;
    group.add(mesh);
    return mesh;
  }
  function round(group, color, position, scale, rotation) {
    return part(group, sphere, color, position, scale, rotation);
  }
  function face(group, y, z, spacing = .11) {
    for (const side of [-1,1]) {
      round(group, '#302b29', [side*spacing,y,z], [.029,.037,.018]);
      round(group, '#fff9e5', [side*spacing-.008,y+.012,z+.015], [.009,.01,.004]);
      round(group, '#ed9d94', [side*(spacing+.07),y-.06,z-.008], [.042,.023,.015]);
    }
    round(group, '#644334', [0,y-.09,z+.026], [.033,.018,.018]);
  }
  function creature(base, color) {
    const group = new T.Group();
    const cream = '#ffedca';
    if (base === 'turtle') {
      round(group,color,[0,.25,0],[.36,.22,.4]);
      round(group,'#5c9555',[0,.17,.35],[.2,.16,.2]);
      for (const side of [-1,1]) for (const z of [-.22,.2]) round(group,'#7caa61',[side*.27,.07,z],[.12,.075,.13]);
      for (const x of [-.16,0,.16]) round(group,'#accc78',[x,.43,0],[.08,.018,.13]);
      face(group,.2,.52,.085);
    } else if (base === 'frog') {
      round(group,color,[0,.22,0],[.3,.25,.24]);
      round(group,cream,[0,.15,.17],[.2,.14,.09]);
      for (const side of [-1,1]) {
        round(group,color,[side*.29,.065,.13],[.18,.075,.16]);
        round(group,color,[side*.16,.43,.12],[.1,.12,.09]);
        round(group,'#fff7da',[side*.16,.45,.19],[.07,.08,.035]);
        round(group,'#243a2b',[side*.16,.45,.22],[.034,.043,.018]);
      }
      round(group,'#4a6240',[0,.22,.23],[.1,.018,.018]);
    } else if (base === 'duck') {
      round(group,color,[0,.24,0],[.28,.25,.33]);
      round(group,color,[0,.56,.13],[.23,.22,.22]);
      for(const side of [-1,1]) {
        round(group,'#e8a94b',[side*.14,.04,.18],[.13,.035,.15]);
        round(group,cream,[side*.25,.3,-.02],[.085,.14,.2],side*.3);
      }
      face(group,.59,.32,.09);
      round(group,'#ec9b37',[0,.49,.36],[.14,.044,.1]);
    } else if (base === 'bee') {
      round(group,color,[0,.27,0],[.24,.24,.31]);
      for(const z of [-.12,.07]) round(group,'#725132',[0,.27,z],[.245,.245,.05]);
      for(const side of [-1,1]) {
        round(group,'#eafaff',[side*.2,.47,-.04],[.18,.08,.22],side*.5);
        round(group,'#705132',[side*.11,.53,.2],[.018,.12,.018],-side*.25);
      }
      round(group,color,[0,.3,.24],[.22,.21,.14]);
      face(group,.34,.36,.075);
    } else if (base === 'hedgehog') {
      round(group,color,[0,.28,-.07],[.34,.28,.35]);
      for(let i=0;i<17;i++) {
        const a=i*2.399;
        const radius=.16+ i%3*.045;
        part(group,cone,color,[Math.cos(a)*radius,.32+ (i%4)*.05,Math.sin(a)*radius-.1],[.07,.16,.07],Math.cos(a)*.5);
      }
      round(group,cream,[0,.21,.22],[.24,.18,.22]);
      face(group,.25,.4,.087);
      round(group,'#533a2e',[0,.15,.43],[.05,.035,.035]);
      for(const side of [-1,1]) round(group,'#ab7958',[side*.23,.06,.13],[.1,.06,.13]);
    } else {
      const fox = base === 'fox';
      round(group,color,[0,.32,-.04],[.25,.3,.23]);
      round(group,cream,[0,.29,.145],[.16,.21,.085]);
      round(group,color,[0,.67,.02],[.29,.25,.24]);
      for(const side of [-1,1]) {
        part(group,cone,color,[side*.19,.91,.005],[.13,.26,.12],-side*.18);
        part(group,cone,'#e9a7a3',[side*.19,.925,.067],[.073,.15,.025],-side*.18);
        round(group,color,[side*.16,.07,.08],[.11,.07,.14]);
        round(group,cream,[side*.13,.59,.2],[.12,.08,.07]);
      }
      face(group,.71,.245,.11);
      round(group,'#594130',[0,.63,.29],[.04,.025,.024]);
      const tail=round(group,color,[.35,.25,-.18],[fox ? .21 : .09,.17,.35],-.5);
      tail.rotation.x=.45;
      if(fox) round(group,cream,[.4,.31,-.41],[.14,.13,.15]);
    }
    group.userData.animate = time => { group.rotation.z = Math.sin(time*1.8)*.025; };
    return group;
  }

  const petalColors = {
    daisy:[0xfff6df,0xf6e4d5], sunflower:[0xffd13c,0xffae27],
    cosmos:[0xf587b8,0xf65a9d], lavender:[0xcf9bf0,0x9850ca,0x7648b2,0xebb9fb],
    tulip:[0xff9b38,0xffbd4e], poppy:[0xf05d5c,0xf77e71]
  };
  const coatColors = {
    rabbit:[0xfff2dd,0xffeddb], bird:[0x478cc8,0x64b6e2,0x246998,0x377ebc,0x54a5d5],
    squirrel:[0xb9773f,0xd89655,0x9e582e], ladybug:[0xe14542],
    butterfly:[0x6b2e8d,0xef86dc,0xc643b6,0xffd1ef]
  };
  function matchesPalette(r,g,b,palette) {
    return palette.some(color => Math.abs(color.r-r)+Math.abs(color.g-g)+Math.abs(color.b-b)<.0001);
  }
  const flowers = new Map();
  function flower(definition, stage, variant) {
    if (stage < 2 || definition.id === definition.base || !definition.color) return GardenModels.flower(definition.base || definition.id,stage,variant);
    const key = definition.id + '-' + stage + '-' + variant;
    if(!flowers.has(key)) {
      const model = GardenModels.flower(definition.base,stage,variant);
      const hue = new T.Color(definition.color);
      const palette = petalColors[definition.base].map(value=>new T.Color(value));
      model.traverse(mesh=>{
        if(!mesh.isMesh) return;
        mesh.geometry=mesh.geometry.clone();
        mesh.userData.collectionGeometry=true;
        const colors=mesh.geometry.getAttribute('color');
        const value=new T.Color();
        if(colors) for(let i=0;i<colors.count;i++) {
          value.setRGB(colors.getX(i),colors.getY(i),colors.getZ(i));
          if(matchesPalette(value.r,value.g,value.b,palette)) {
            const light = .75 + Math.max(value.r,value.g,value.b)*.25;
            colors.setXYZ(i,hue.r*light,hue.g*light,hue.b*light);
          }
        }
        if(colors) colors.needsUpdate=true;
      });
      flowers.set(key,model);
    }
    return flowers.get(key).clone();
  }

  function animal(definition) {
    const factories = {
      rabbit:GardenModels.bunny, butterfly:()=>GardenModels.butterfly(definition.color || 'pink'),
      bird:GardenModels.bird, squirrel:GardenModels.squirrel, ladybug:GardenModels.ladybug
    };
    const factory=factories[definition.base];
    const model=factory ? factory() : creature(definition.base,definition.color || '#dfb17d');
    if(factory && definition.color && definition.id!==definition.base) {
      const tint=new T.Color(definition.color);
      const palette=coatColors[definition.base].map(value=>new T.Color(value));
      model.traverse(mesh=>{
        if(!mesh.isMesh || !mesh.geometry.getAttribute('color')) return;
        mesh.geometry=mesh.geometry.clone();
        mesh.userData.collectionGeometry=true;
        const colors=mesh.geometry.getAttribute('color');
        for(let i=0;i<colors.count;i++) {
          const r=colors.getX(i),g=colors.getY(i),b=colors.getZ(i);
          if(matchesPalette(r,g,b,palette)) {
            const brightness=Math.max(r,g,b);
            colors.setXYZ(i,tint.r*brightness,tint.g*brightness,tint.b*brightness);
          }
        }
        colors.needsUpdate=true;
      });
    }
    return model;
  }
  window.GardenCollectionModels={flower,animal};
})();
