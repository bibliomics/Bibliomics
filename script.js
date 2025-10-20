let comics = [];
const STORAGE_KEYS = {FAV:'bibliomics_favs', HST:'bibliomics_hist', RATING:'bibliomics_ratings', USER:'bibliomics_user'};
function qs(s){return document.querySelector(s)}
function qsa(s){return Array.from(document.querySelectorAll(s))}

async function loadData(){
  try{
    const res = await fetch('comics.json');
    comics = await res.json();
    renderSections();
    attachHandlers();
  }catch(e){console.error('Erreur lecture comics.json',e)}
}

function attachHandlers(){
  qs('#discover-random').addEventListener('click', pickRandom);
  qs('#btn-dice').addEventListener('click', pickRandom);
  qs('#modal-close').addEventListener('click', ()=>qs('#modal').classList.add('hidden'));
  qsa('.cat-btn').forEach(b=>b.addEventListener('click', ()=>renderCategory(b.dataset.cat)));
  qs('#btn-library').addEventListener('click', showLibrary);
  qs('#btn-history').addEventListener('click', showHistory);
  qs('#btn-login').addEventListener('click', fakeLogin);
}

function renderSections(){
  const localRatings = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATING)||'{}');
  const merged = comics.map(c=>{
    const lr = localRatings[c.id];
    const rating = lr ? lr.avg : (c.rating||0);
    return {...c, rating};
  });
  const best = merged.slice().sort((a,b)=>b.rating - a.rating).slice(0,8);
  fillRow('best-row', best);
  const latest = comics.slice().sort((a,b)=> (b.added||0)-(a.added||0)).slice(0,12);
  fillRow('latest-row', latest);
  renderCategory('Comics Indé');
}

function fillRow(elemId, items){
  const row = qs('#'+elemId);
  row.innerHTML = '';
  items.forEach(it=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<div class="cover" style="background-image:url('${it.cover}')"></div>
      <div class="meta"><div class="title">${it.title}</div><div class="desc">${it.short||''}</div></div>`;
    card.addEventListener('click', ()=>openReader(it.id));
    row.appendChild(card);
  });
}

function renderCategory(cat){
  const list = comics.filter(c=>c.category===cat);
  fillRow('cat-row', list);
}

function openReader(id){
  const item = comics.find(c=>c.id===id);
  if(!item) return;
  qs('#modal').classList.remove('hidden');
  const reader = qs('#reader-area'); reader.innerHTML = '';
  if(item.viewer && item.viewer.type==='iframe'){
    const ifr = document.createElement('iframe');
    ifr.src = item.viewer.src; ifr.style.width='100%'; ifr.style.height='100%'; ifr.frameBorder=0;
    reader.appendChild(ifr);
  } else if(Array.isArray(item.images) && item.images.length){
    const wrap = document.createElement('div'); wrap.className='img-gallery';
    item.images.forEach(src=>{ const img=document.createElement('img'); img.src=src; img.style.maxWidth='100%'; img.style.display='block'; wrap.appendChild(img); });
    reader.appendChild(wrap);
  } else { reader.innerHTML = '<div style="color:#fff">Aperçu non disponible. Utilisez "Télécharger".</div>' }
  qs('#download-btn').onclick = ()=> { if(item.download) window.open(item.download,'_blank'); else alert('Pas de lien de téléchargement.'); }
  qs('#add-fav').onclick = ()=> toggleFav(item.id);
  renderRatingUI(item.id);
  pushHistory(item.id);
}

function toggleFav(id){
  const favs = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAV)||'[]');
  const idx = favs.indexOf(id);
  if(idx===-1){ favs.push(id); alert('Ajouté à Ma bibliothèque'); }
  else { favs.splice(idx,1); alert('Retiré de Ma bibliothèque'); }
  localStorage.setItem(STORAGE_KEYS.FAV, JSON.stringify(favs));
}

function showLibrary(){
  const favs = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAV)||'[]');
  const list = comics.filter(c=>favs.includes(c.id));
  fillRow('cat-row', list);
}

function pushHistory(id){
  const hist = JSON.parse(localStorage.getItem(STORAGE_KEYS.HST)||'[]');
  hist.unshift({id, at:Date.now()});
  if(hist.length>50) hist.pop();
  localStorage.setItem(STORAGE_KEYS.HST, JSON.stringify(hist));
}

function showHistory(){
  const hist = JSON.parse(localStorage.getItem(STORAGE_KEYS.HST)||'[]');
  const ids = hist.map(h=>h.id);
  const list = comics.filter(c=>ids.includes(c.id));
  fillRow('cat-row', list);
}

function pickRandom(){
  const tome1 = comics.filter(c=>c.tome===1);
  if(!tome1.length) return alert('Aucun tome 1 trouvé.');
  const pick = tome1[Math.floor(Math.random()*tome1.length)];
  openReader(pick.id);
}

function renderRatingUI(id){
  const ratings = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATING)||'{}');
  const container = qs('#rating-area'); container.innerHTML='';
  const current = ratings[id] ? Math.round(ratings[id].avg) : 0;
  for(let i=1;i<=5;i++){
    const s = document.createElement('span'); s.className='star'; s.innerText='★';
    s.style.color = (i<=current)?'var(--accent)':'#444';
    s.addEventListener('click', ()=>submitRating(id,i));
    container.appendChild(s);
  }
}

function submitRating(id, val){
  const ratings = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATING)||'{}');
  if(!ratings[id]) ratings[id] = {sum:0,count:0,avg:0};
  ratings[id].sum += val; ratings[id].count += 1; ratings[id].avg = ratings[id].sum/ratings[id].count;
  localStorage.setItem(STORAGE_KEYS.RATING, JSON.stringify(ratings));
  alert('Merci pour ta note !');
  renderSections();
  renderRatingUI(id);
}

function fakeLogin(){
  const name = prompt('Nom d\'affichage (local) :');
  if(!name) return;
  localStorage.setItem(STORAGE_KEYS.USER, name);
  alert('Connecté en tant que '+name+' (session locale)');
}

loadData();

[
  {
    "id": 1,
    "titre": "Spider-Man: Renaissance",
    "auteur": "Stan Lee",
    "categorie": "Marvel",
    "note": 4.8,
    "image": "https://upload.wikimedia.org/wikipedia/en/0/0c/Spiderman50.jpg",
    "description": "Peter Parker affronte son destin dans une aventure emblématique de l’univers Marvel."
  },
  {
    "id": 2,
    "titre": "Batman: Année Un",
    "auteur": "Frank Miller",
    "categorie": "DC",
    "note": 4.7,
    "image": "https://upload.wikimedia.org/wikipedia/en/4/4a/Batman_Year_One.jpg",
    "description": "Les débuts de Batman, entre justice, corruption et vengeance à Gotham City."
  }
]

// script.js

// Charger la liste de comics depuis comics.json
fetch('comics.json')
  .then(response => response.json())
  .then(comics => {
    const container = document.querySelector('.nouveaux-comics');

    // Vérifie que le conteneur existe
    if (!container) {
      console.error('Conteneur .nouveaux-comics introuvable dans le HTML');
      return;
    }

    // Crée une carte pour chaque comic
    comics.forEach(comic => {
      const card = document.createElement('div');
      card.classList.add('comic-card');
      card.innerHTML = `
        <img src="${comic.image}" alt="${comic.titre}" />
        <h3>${comic.titre}</h3>
        <p><strong>${comic.auteur}</strong></p>
        <p>${comic.description}</p>
      `;
      container.appendChild(card);
    });
  })
  .catch(error => console.error('Erreur chargement comics:', error));
