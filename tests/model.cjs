const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../dist/model.js');
test('une absence est distincte d’un zéro et les annulées sont exclues des heures prévues',()=>{
  const s=M.summary([
    {Etat_de_l_action:'Réalisé',Duree_reelle_h:0,Duree_prevue_h:2,Effectif_present:0},
    {Etat_de_l_action:'Réalisé',Duree_reelle_h:null,Duree_prevue_h:3,Effectif_present:null},
    {Etat_de_l_action:'À venir',Duree_reelle_h:99,Duree_prevue_h:null,Effectif_present:99},
    {Etat_de_l_action:'Annulé',Duree_reelle_h:99,Duree_prevue_h:20,Effectif_present:99}
  ]);
  assert.equal(s.plannedHours,5);assert.equal(s.actualHours,0);assert.equal(s.durationCount,1);
  assert.equal(s.participants,0);assert.equal(s.participantsCount,1);assert.equal(s.missingPlannedDuration,1);
  assert.equal(s.averageDuration,0);assert.equal(s.medianDuration,0);
});
test('les moyennes et médianes utilisent les durées réelles des seules activités réalisées',()=>{
  const s=M.summary([1,3,8,12].map(n=>({Etat_de_l_action:'Réalisé',Duree_reelle_h:n})));
  assert.equal(s.averageDuration,6);assert.equal(s.medianDuration,5.5);
  assert.equal(M.summary([]).averageDuration,null);
});
test('les filtres de date respectent la date de contact du démarchage et les activités sans date',()=>{
  const rows=[
    {id:1,Type_d_activite:'Démarchage',Date_contact:Date.UTC(2026,0,1)/1000,Date_prevue:Date.UTC(2027,0,1)/1000,Atelier_organisateur:1},
    {id:2,Type_d_activite:'Prestation',Date_prevue:null,Atelier_organisateur:1},
    {id:3,Type_d_activite:'Prestation',Date_prevue:Date.UTC(2027,0,1)/1000,Atelier_organisateur:2}
  ];
  assert.deepEqual(M.filter(rows,{year:'2026',workshop:'1'}).map(r=>r.id),[1]);
  assert.equal(M.filter(rows,{}).length,3);assert.equal(M.filter(rows,{year:'2027'}).length,1);
});
test('l’attribution des activités est unique à l’atelier organisateur',()=>{
  const rows=[{id:1,Atelier_organisateur:1,Ateliers_associes:['L',2,3]}];
  assert.equal(M.filter(rows,{workshop:'2'}).length,0);
  assert.equal(M.group(rows,'Atelier_organisateur').length,1);
});
test('les références multiples Grist sont décodées sans compter le marqueur L',()=>{
  assert.deepEqual(M.list(['L',2,3]),[2,3]);assert.deepEqual(M.list(null),[]);
  const s=M.summary([{Partenaires:['L',2,3]},{Partenaires:['L',2]}]);
  assert.equal(s.partners,2);assert.equal(s.withoutPartner,0);
});
test('le ciblage des relances inclut les échéances COQ même sans état À relancer',()=>{
  assert.equal(M.filter([{Relance_COQ_a_prevoir:true,Etat_de_l_action:'En cours'},{Etat_de_l_action:'À relancer'},{Etat_de_l_action:'À venir'}],{alerts:'1'}).length,2);
});
test('les exports CSV échappent guillemets et neutralisent les formules dans les textes',()=>{
  const csv=M.csv([{v:'=1+1'},{v:'a;"b"'},{v:-2},{v:'\n=1'}],[{label:'Texte',value:r=>r.v}]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"a;""b"""'));assert.ok(csv.includes('"-2"'));
  assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"\'\n=1"'));
});
