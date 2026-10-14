import uiCatalog from './locales/ui.json' with {type:'json'};
import french from './locales/fr.json' with {type:'json'};
import english from './locales/en.json' with {type:'json'};

let modules;
try{modules={
  './locales/fr.json':french,'./locales/en.json':english,
  ...import.meta.glob(['./locales/*.json','!./locales/fr.json','!./locales/en.json','!./locales/ui.json'],{eager:true,import:'default'}),
};}
catch{modules={'./locales/fr.json':french,'./locales/en.json':english};}
const locales=Object.fromEntries(Object.entries(modules)
  .filter(([path])=>!path.endsWith('/ui.json'))
  .map(([path,value])=>[path.split('/').pop().replace('.json',''),value]));
export const supportedLanguages=Object.keys(locales);
const cache=new Map();
export function registerLanguage(language,messages){
  locales[language]=messages;
  cache.delete(language);
  if(!supportedLanguages.includes(language))supportedLanguages.push(language);
}
function merge(base,extra){
  if(Array.isArray(base))return extra??base;
  if(base&&typeof base==='object')return Object.fromEntries(Object.keys({...base,...extra}).map(key=>[key,merge(base[key],extra?.[key])]));
  return extra??base;
}
export function getTranslations(language='fr'){
  if(!cache.has(language))cache.set(language,merge(locales.en,locales[language]));
  return cache.get(language);
}
export function uiText(key,language='fr'){
  return locales[language]?.ui?.[key]??uiCatalog[key]?.[language]??uiCatalog[key]?.en??key;
}
export function translateText(text,language='fr'){
  if(typeof text!=='string')return text;
  const key=textKeys.get(text);
  return key?uiText(key,language):text;
}
const textKeys=new Map();
for(const [key,values]of Object.entries(uiCatalog))for(const text of Object.values(values))if(!textKeys.has(text))textKeys.set(text,key);
const dataTerms=[
  {fr:'Rapport créé',en:'Report created'},
  {fr:'Rapport fermé',en:'Report closed'},
  {fr:'Rapport réouvert',en:'Report reopened'},
  {fr:'Rapport renommé',en:'Report renamed'},
  {fr:'Activité ajoutée',en:'Activity added'},
  {fr:'Activité modifiée',en:'Activity updated'},
  {fr:'Activité supprimée',en:'Activity deleted'},
  {fr:'Dépense ajoutée',en:'Expense added'},
  {fr:'Investisseur créé',en:'Investor created'},
  {fr:'Paramètres sauvegardés',en:'Settings saved'},
  {fr:'ouvert',en:'opened'},
  {fr:'Profit cible',en:'Target profit'},
  {fr:'Nouveau profit enregistré',en:'New profit recorded'},
  {fr:'disponible',en:'available'},
  {fr:'FRAIS DE RANGEMENT DE CEINTURE',en:'BELT STORAGE FEES'},
  {fr:'Transport de marchandise',en:'Merchandise transport'},
  {fr:'Achat de marchandise',en:'Merchandise purchase'},
  {fr:'Vente de marchandise',en:'Merchandise sale'},
  {fr:'Transport Tuiles',en:'Tile transport'},
  {fr:'Salaires Chauffeurs',en:'Driver Salaries'},
  {fr:'Impôt',en:'Tax'}, {fr:'Hôtel',en:'Hotel'},
  {fr:'Location voiture',en:'Car rental'},
  {fr:'Caoutchouc',en:'Rubber'}, {fr:'Engrais',en:'Fertilizer'},
  {fr:'Tuiles',en:'Tiles'}, {fr:'Camion',en:'Truck'},
  {fr:'1er',en:'1st'}, {fr:'2e',en:'2nd'},
  {fr:'nuits',en:'nights'}, {fr:'jours',en:'days'},
];
const escapeRegex=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function translateData(text,language='fr',translations){
  if(translations?.[language])return translations[language];
  if(typeof text!=='string')return text;
  const direct=translateText(text,language);
  if(direct!==text)return direct;
  const months=locales.fr.months??['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const englishMonths=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const terms=[...dataTerms,{fr:'Rapport',en:'Report'},...months.map((fr,i)=>({fr,en:englishMonths[i]})),...Object.entries(locales.fr.categories).map(([index,fr])=>({fr,en:locales.en.categories[index]}))];
  const lookup=new Map();
  for(const term of terms){
    const target=locales[language]?.data?.[term.fr]??term[language];
    if(!target)continue;
    for(const original of Object.values(term))lookup.set(original.toLocaleLowerCase(),target);
  }
  const keys=[...lookup.keys()].sort((a,b)=>b.length-a.length);
  if(!keys.length)return text;
  // Preserve company names/routes; substitute known business phrases only.
  return text.replace(new RegExp(`(?<![\\p{L}\\p{N}])(?:${keys.map(escapeRegex).join('|')})(?![\\p{L}\\p{N}])`,'giu'),word=>lookup.get(word.toLocaleLowerCase()));
}
export const escapeHTML=text=>String(text??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function translateMarkup(html,language){
  const parsed=new DOMParser().parseFromString(html,'text/html');
  const walker=parsed.createTreeWalker(parsed,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const node=walker.currentNode;
    if(node.parentElement?.closest('style,script'))continue;
    const text=node.textContent.trim(),translated=translateText(text,language);
    if(translated!==text)node.textContent=node.textContent.replace(text,translated);
  }
  return '<!DOCTYPE html>'+parsed.documentElement.outerHTML;
}
