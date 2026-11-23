(() => {
  window.installGardenActivities = function({state,economy,onChange,onFriend,onCare,onArea,previews,onPreview}) {
    const $=id=>document.getElementById(id);
    const wallet=state.economy;
    let shopTab='seeds';
    let animalFilter='all';
    let selectedPet=wallet.animals[0] || GardenEconomy.animals[0].id;
    let selectedFlower=GardenEconomy.flowers[0];
    function show(dialog) { if(!dialog.open) dialog.showModal(); }
    function note(id,result,success) {
      $(id).textContent=result.ok ? success : result.message;
      if(result.ok) onChange();
    }
    function button(label,action,disabled=false) {
      const element=document.createElement('button');
      element.type='button';element.textContent=label;element.disabled=disabled;element.onclick=action;
      return element;
    }
    function card(icon,title,description) {
      const element=document.createElement('article');
      element.className='activity-card';
      const symbol=document.createElement('span');symbol.className='card-symbol';symbol.textContent=icon;
      const heading=document.createElement('h3');heading.textContent=title;
      const text=document.createElement('p');text.textContent=description;
      element.append(symbol,heading,text);
      return element;
    }
    function modelCard(type, definition, select) {
      const art = document.createElement('button');
      art.type = 'button';
      art.className = 'catalog-art';
      art.setAttribute('aria-label', 'Preview ' + definition.name);
      const fallback = document.createElement('span');
      fallback.className = 'thumbnail-fallback';
      fallback.textContent = definition.icon;
      art.append(fallback);
      previews.thumbnail(type, definition).then(url => {
        if (!url) return;
        const image = document.createElement('img');
        image.className = 'model-thumbnail';
        image.src = url;
        image.alt = definition.name + ' 3D model';
        fallback.replaceWith(image);
      });
      const hint = document.createElement('span');
      hint.textContent = 'View in 3D';
      art.append(hint);
      art.onclick = select;
      return art;
    }

    function previewFlower(host, flower) {
      selectedFlower = flower;
      onPreview(host, 'flower', flower);
    }

    function shop() {
      $('shop-coins').textContent=wallet.coins;
      const content=$('shop-content');content.replaceChildren();
      $('shop-tabs').querySelectorAll('button').forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.tab===shopTab)));
      if(shopTab==='seeds' || shopTab==='sell') {
        for(const flower of GardenEconomy.flowers) {
          const selling=shopTab==='sell';
          const count=selling?wallet.bag[flower.id]:wallet.seeds[flower.id];
          const item=card(flower.icon,flower.name,
            selling ? count+' in basket · '+flower.sellPrice+' coins each' : count+' seeds owned · '+flower.seedPrice+' coins each');
          item.querySelector('.card-symbol').remove();
          item.prepend(modelCard('flower', flower, () => previewFlower($('shop-preview-host'), flower)));
          item.append(button(selling?'Sell one · +'+flower.sellPrice:'Buy one · '+flower.seedPrice,()=>{
            const result=selling?economy.sell(flower.id):economy.buySeed(flower.id);
            note('shop-status',result,selling?'Flower sold! +'+flower.sellPrice+' coins.':'A new '+flower.name.toLowerCase()+' seed!');
            shop();
          },selling?count<1:wallet.coins<flower.seedPrice));
          if(selling && count>1) item.append(button('Sell all · +'+count*flower.sellPrice,()=>{
            note('shop-status',economy.sell(flower.id,count),'Flowers sold!');
            shop();
          }));
          content.append(item);
        }
      } else {
        for(const item of GardenEconomy.items.filter(item=>item.type==='decor')) {
          const owned=wallet.owned.includes(item.id);
          const panel=card(item.icon,item.name,owned?'In your garden':item.price+' coins');
          panel.append(button(owned?'Owned':'Buy · '+item.price,()=>{
            note('shop-status',economy.buyItem(item.id),item.name+' added to your garden!');
            shop();
          },owned || wallet.coins<item.price));
          content.append(panel);
        }
      }
    }
    $('shop-tabs').querySelectorAll('button').forEach(tab=>tab.onclick=()=>{
      shopTab=tab.dataset.tab;
      $('shop-preview-host').hidden=shopTab==='decor';
      shop();
      if(shopTab!=='decor')previewFlower($('shop-preview-host'),selectedFlower);
    });

    function request() {
      const order=economy.request();
      const flower=GardenEconomy.flowers.find(flower=>flower.id===order.kind);
      $('request-title').textContent=order.icon+' '+order.animalName+' wants a bouquet';
      $('request-description').textContent='Grow and pick '+order.quantity+' '+flower.name.toLowerCase()+(order.quantity===1?'':' flowers')+'.';
      $('request-progress').textContent=Math.min(order.available,order.quantity)+' / '+order.quantity+' in your basket · Reward '+order.reward+' coins';
      const complete=$('deliver');
      complete.disabled=!order.ready;
      complete.onclick=()=>{
        note('request-status',economy.completeRequest(order.generation),'Bouquet delivered! +'+order.reward+' coins. A new request is ready.');
        request();
      };
    }
    function animals() {
      $('animal-count').textContent=wallet.animals.length+' / '+GardenEconomy.animals.length;
      $('animal-filters').querySelectorAll('button').forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.filter===animalFilter)));
      const list=$('animal-cards');list.replaceChildren();
      for(const pet of GardenEconomy.animals) {
        const owned=wallet.animals.includes(pet.id);
        if(animalFilter==='owned'&&!owned || animalFilter==='missing'&&owned)continue;
        const seed=GardenEconomy.flowers.find(flower=>pet.seeds.includes(flower.id));
        const item=card(pet.icon,owned?(wallet.names[pet.id]||pet.name):pet.name,
          pet.rarity+' · '+(owned?'Discovered ✓':seed.name+' seeds'));
        item.classList.toggle('undiscovered',!owned);
        item.querySelector('.card-symbol').remove();
        item.prepend(modelCard('animal', pet, () => {
          selectedPet = pet.id;
          onPreview($('animal-preview-host'), 'animal', pet);
          renderPet();
        }));
        item.append(button(owned?'Meet '+(wallet.names[pet.id]||pet.name):'Not discovered',()=>{
          selectedPet=pet.id;
          onFriend(pet.id);
          onPreview($('animal-preview-host'), 'animal', pet);
          renderPet();
        },!owned));
        list.append(item);
      }
      renderPet();
    }
    function renderPet() {
      const pet=GardenEconomy.animals.find(pet=>pet.id===selectedPet);
      const area=$('pet-care');
      area.hidden=!pet || !wallet.animals.includes(selectedPet);
      if(area.hidden)return;
      $('pet-title').textContent=pet.icon+' '+(wallet.names[pet.id]||pet.name);
      $('pet-description').textContent=pet.name+' is now beside your gardener. Grow another bloom to feed again.';
      $('pet-name').value=wallet.names[pet.id]||'';
      $('feed-pet').onclick=()=>{
        const result=economy.care(pet.id);
        note('animal-status',result,'A happy friend! +'+(result.coins||0)+' coins.');
        if(result.ok)onCare(pet.id);
      };
      $('name-pet').onsubmit=event=>{
        event.preventDefault();
        note('animal-status',economy.namePet(pet.id,$('pet-name').value),'Name saved!');
        animals();
      };
    }
    $('animal-filters').querySelectorAll('button').forEach(tab=>tab.onclick=()=>{
      animalFilter=tab.dataset.filter;animals();
    });

    const badges=[
      ['first','🌱','First bloom',()=>state.blooms>=1],
      ['bouquet','💐','Bouquet helper',()=>wallet.deliveries>=1],
      ['seller','🪙','Flower seller',()=>wallet.sold>=5],
      ['grower','🌻','Busy grower',()=>state.blooms>=20],
      ['friend','🐾','Ten friends',()=>wallet.animals.length>=10],
      ['collector','🦋','Twenty-five friends',()=>wallet.animals.length>=25],
      ['thinker','⭐','Puzzle explorer',()=>state.solved>=5],
      ['fashion','👒','Style collector',()=>wallet.owned.filter(id=>id.startsWith('hat-')||id.startsWith('outfit-')).length>=12],
      ['home','🏡','Cozy garden',()=>wallet.owned.filter(id=>id.startsWith('decor-')).length>=3],
      ['all','🌈','Animal album',()=>wallet.animals.length===50]
    ];
    function journal() {
      $('puzzle-count').textContent=state.solved;
      $('bouquet-count').textContent=Object.values(state.counts).reduce((sum,n)=>sum+n,0);
      const badgeList=$('stickers');badgeList.replaceChildren();
      for(const [id,icon,name,earned] of badges) {
        const item=card(icon,name,earned()?'Collected ✓':'Keep growing');
        item.classList.toggle('undiscovered',!earned());badgeList.append(item);
      }
      const vase=$('flowers');vase.replaceChildren();
      for(const flower of GardenEconomy.flowers) {
        const chosen=state.vase.includes(flower.id);
        const card=document.createElement('article');
        card.className='flower-journal-card';
        card.append(modelCard('flower',flower,()=>previewFlower($('journal-preview-host'),flower)));
        const title=document.createElement('h4');
        title.textContent=flower.name;
        const count=document.createElement('p');
        count.textContent=state.counts[flower.id]+' picked';
        const option=button(chosen?'Remove from vase':'Add to vase',()=>{
          if(chosen)state.vase=state.vase.filter(id=>id!==flower.id);
          else state.vase=[...state.vase.slice(-5),flower.id];
          onChange();journal();
        },!state.counts[flower.id]);
        option.setAttribute('aria-pressed',String(chosen));
        card.append(title,count,option);
        vase.append(card);
      }
    }

    function areas() {
      const destinations=[['garden','🌷 Garden',null],['pond','🪷 Pond','decor-pond'],['butterfly','🦋 Meadow','decor-butterfly']];
      $('areas').replaceChildren(...destinations.map(([id,name,item])=>{
        const owned=!item||wallet.owned.includes(item);
        const choice=button(name+(owned?'':' 🔒'),()=>{
          if(!owned){shopTab='decor';shop();$('shop-preview-host').hidden=true;show($('shop-dialog'));return;}
          state.area=id;onArea(id);onChange();areas();
        });
        choice.setAttribute('aria-pressed',String((state.area||'garden')===id));
        return choice;
      }));
    }
    return {
      openShop(tab='seeds'){
        shopTab=tab;shop();$('shop-status').textContent='';show($('shop-dialog'));
        $('shop-preview-host').hidden=shopTab==='decor';
        if(shopTab!=='decor')previewFlower($('shop-preview-host'),selectedFlower);
      },
      openAnimals(){
        animals();show($('animals-dialog'));
        const pet=GardenEconomy.animals.find(pet=>pet.id===selectedPet);
        onPreview($('animal-preview-host'),'animal',pet);
      },
      openRequests(){request();show($('requests-dialog'));},
      openJournal(){
        journal();show($('vase-dialog'));
        previewFlower($('journal-preview-host'),selectedFlower);
      },
      refresh(){areas();if($('shop-dialog').open)shop();if($('requests-dialog').open)request();},
    };
  };
})();
