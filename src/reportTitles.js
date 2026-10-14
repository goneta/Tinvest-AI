const pairs = [
  ['janvier','January'], ['février','February'], ['mars','March'], ['avril','April'],
  ['mai','May'], ['juin','June'], ['juillet','July'], ['août','August'],
  ['septembre','September'], ['octobre','October'], ['novembre','November'], ['décembre','December'],
  ['janv','Jan'], ['févr','Feb'], ['avr','Apr'], ['juil','Jul'], ['sept','Sep'], ['oct','Oct'], ['nov','Nov'], ['déc','Dec'],
  ['rapport financier mensuel','Monthly financial report'], ['rapport mensuel','Monthly report'],
  ['rapport','Report'], ['caoutchouc','Rubber'], ['engrais','Fertilizer'], ['tuiles','Tiles'],
];
const dictionaries = Object.fromEntries(['fr','en'].map(lang=>[lang,new Map(pairs.flatMap(([fr,en])=>
  [[fr,lang==='fr'?fr:en],[en.toLowerCase(),lang==='fr'?fr:en]]))]));

// Translate only fully recognized titles; never change stored user text.
export function translateReportTitle(title,lang){
  if(typeof title!=='string'||!dictionaries[lang])return title;
  const dictionary=dictionaries[lang];
  const phrases=[...dictionary.keys()].sort((a,b)=>b.length-a.length);
  const pattern=new RegExp(phrases.join('|')+'|[\\p{L}]+','giu');
  let unknown=false;
  const translated=title.replace(pattern,(word,offset)=>{
    const value=dictionary.get(word.toLowerCase());
    if(!value){unknown=true;return word;}
    // Avoid translating a known month embedded inside a proper name.
    if(/[\p{L}]/u.test(title[offset-1]||'')||/[\p{L}]/u.test(title[offset+word.length]||'')){unknown=true;return word;}
    return value.charAt(0).toUpperCase()+value.slice(1);
  });
  return unknown?title:translated;
}
