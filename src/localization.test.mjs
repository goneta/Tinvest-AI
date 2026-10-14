import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getTranslations,translateData,translateText,uiText,escapeHTML,registerLanguage,supportedLanguages} from './localization.js';

test('activities translate business terms and preserve routes and unknown text',()=>{
  assert.equal(translateData('Transport de marchandise','en'),'Merchandise transport');
  assert.equal(translateData('Camion GHANA (Engrais)','en'),'Truck GHANA (Fertilizer)');
  assert.equal(translateData('Transport Tuiles (ALEPE–SAN PEDRO)','en'),'Tile transport (ALEPE–SAN PEDRO)');
  assert.equal(translateData('FRAIS DE RANGEMENT DE CEINTURE','en'),'BELT STORAGE FEES');
  assert.equal(translateData('Truck GHANA (Fertilizer)','fr'),'Camion GHANA (Engrais)');
  assert.equal(translateData('MELCHAT GHANA LIMITED','en'),'MELCHAT GHANA LIMITED');
  assert.equal(translateData('Description personnelle inconnue','en'),'Description personnelle inconnue');
  assert.equal(translateData('texte','de',{de:'Übersetzung'}),'Übersetzung');
});
test('missing locale and keys fall back without breaking the interface',()=>{
  assert.equal(getTranslations('unknown').nav.reports,'Reports');
  assert.equal(translateText('Own Contract','fr'),'Contrat propre');
  assert.equal(uiText('missing','fr'),'missing');
  assert.equal(translateData('Engrais','unknown'),'Engrais');
});
test('future languages can supply UI and business data while inheriting missing keys',()=>{
  registerLanguage('es',{languageName:'Español',nav:{reports:'Informes'},data:{Engrais:'Fertilizante'}});
  assert.ok(supportedLanguages.includes('es'));
  assert.equal(getTranslations('es').nav.reports,'Informes');
  assert.equal(getTranslations('es').activity.revenue,'Revenue');
  assert.equal(translateData('Camion GHANA (Engrais)','es'),'Camion GHANA (Fertilizante)');
});
test('French and English locale structures and UI catalog entries are complete',()=>{
  const fr=JSON.parse(fs.readFileSync('src/locales/fr.json'));
  const en=JSON.parse(fs.readFileSync('src/locales/en.json'));
  function keys(value,prefix=''){
    return Object.entries(value).flatMap(([key,child])=>child&&typeof child==='object'?keys(child,prefix+key+'.'):[prefix+key]);
  }
  assert.deepEqual(keys(fr).sort(),keys(en).sort());
  const catalog=JSON.parse(fs.readFileSync('src/locales/ui.json'));
  for(const [key,entry]of Object.entries(catalog)){
    assert.equal(typeof entry.fr,'string',key);assert.equal(typeof entry.en,'string',key);
  }
});
test('actual financial print renderer contains translated activity data and safe text',()=>{
  const source=fs.readFileSync('src/App.jsx','utf8');
  const start=source.indexOf('function buildPrintHeader(');
  const end=source.indexOf('function buildCertificateHTML(',start);
  const build=Function('getTranslations','uiText','translateData','translateText','translateReportTitle','escapeHTML',`
    const T=new Proxy({}, {get:(_,lang)=>getTranslations(lang)}),_C={},_lang='en';
    const fmtDate=()=> '02/02/2026',fmtDateTime=()=> '02/02/2026 10:00',fmtNum=String,getCurrencyLines=()=>[];
    ${source.slice(start,end)}
    return buildReportHTML;
  `)(getTranslations,uiText,translateData,translateText,translateData,escapeHTML);
  const report={label:'Juin 2026',investorId:1,openingInvestment:1000,activities:[{category:'Transport de marchandise',description:'Camion GHANA (Engrais)',company:'A & B',truckType:'rental',contractType:'sub_contract',invested:10,revenue:20,expenses:0,profit:10,date:'2026-02-02'}],additionalExpenses:[],signatures:[]};
  const calc={totalInvested:10,totalRevenue:20,actExp:0,totalExpenses:0,netProfit:10,newInvestment:1010,addExp:0};
  const html=build(report,calc,[],{},'en');
  assert.match(html,/Merchandise transport/);assert.match(html,/Truck GHANA \(Fertilizer\)/);
  assert.match(html,/Sub Contract/);assert.match(html,/Generated on/);assert.match(html,/A &amp; B/);
  assert.doesNotMatch(html,/Généré le|Transport de marchandise|Camion GHANA/);
  assert.equal(report.activities[0].description,'Camion GHANA (Engrais)');
  const french=build(report,calc,[],{},'fr');
  assert.match(french,/Camion GHANA \(Engrais\)/);assert.match(french,/Sous-contrat/);
});
