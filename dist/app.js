(function(){
  'use strict';
  const M=window.PilotageModel;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(v,d=0)=>v==null?'—':Number(v).toLocaleString('fr-FR',{maximumFractionDigits:d});
  const percent=(n,d)=>d?Math.round(n/d*100)+' %':'—';
  const date=v=>{const d=M.date(v);return d?d.toLocaleDateString('fr-FR',{timeZone:'UTC'}):'Non renseignée'};
  const months=['Jan.','Fév.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
  const types=['Action interne','Démarchage','Prestation','Formation PDFC/PrAF'];
  const colors=['#187d73','#d7b870','#658bb5','#a4bda0','#c27e54','#ad777c','#a1aaa5'];
  const statusColors={'À venir':'#658bb5','En cours':'#187d73','Réalisé':'#8eb498','Reporté':'#d7b870','Annulé':'#b7bdb9','À relancer':'#c27e54'};
  const definitions={
    overview:{label:'Vue d’ensemble',title:'Une vision commune de l’activité.',description:'Les repères essentiels pour comprendre la programmation et orienter les décisions.',icon:'grid'},
    workshops:{label:'Ateliers & programmation',title:'Comprendre les équilibres entre ateliers.',description:'Volumes programmés, répartition dans le temps et personnes mobilisées.',icon:'calendar'},
    partners:{label:'Partenariats',title:'Lire les relations qui se construisent.',description:'Identifier les partenaires mobilisés et les pistes de développement territorial.',icon:'network'},
    themes:{label:'Thématiques & publics',title:'Explorer les sujets et les publics.',description:'Croiser les thématiques, les ateliers et les publics accompagnés.',icon:'layers'},
    activities:{label:'Toutes les activités',title:'Chaque activité, dans son contexte.',description:'Retrouver une activité et ouvrir sa fiche de suivi en un clic.',icon:'list'}
  };
  const paths={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',calendar:'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2 M8 17h2',network:'M9 5a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M2 18a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M16 18a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M10 8L6 15 M14 8l4 7',layers:'M3 7l9-5 9 5-9 5z M3 12l9 5 9-5 M3 17l9 5 9-5',list:'M8 6h13 M8 12h13 M8 18h13 M3 6h1 M3 12h1 M3 18h1'};
  const icon=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';
  let tables={},lookups={},loaded=false,source='demo',snapshotAt=null,live=false;
  let state={view:'overview',year:'',workshop:'',type:'',status:'',theme:'',month:'',alerts:'',search:'',sort:'date',page:1,metric:'hours',planningYear:String(new Date().getFullYear())};
  let lastFocus=null;
  const readRoute=()=>{
    const p=new URLSearchParams(location.hash.slice(1));
    ['view','year','workshop','type','status','theme','month','alerts','search'].forEach(k=>state[k]=p.get(k)||'');
    if(!definitions[state.view])state.view='overview';
  };
  readRoute();
  function writeRoute(){
    const p=new URLSearchParams();
    ['view','year','workshop','type','status','theme','month','alerts','search'].forEach(k=>{if(state[k])p.set(k,state[k])});
    history.replaceState(null,'','#'+p.toString());
  }
  const name=(table,id,fallback='Non renseigné')=>{
    const r=lookups[table]?.get(Number(id));
    return r?(r.Libelle||r.Nom_partenaire||r.Etiquette||[r.Prenom,r.Nom].filter(Boolean).join(' ')||r.Code||fallback):fallback;
  };
  const workshopName=id=>name('ATELIERS',id);
  const workshopShort=id=>lookups.ATELIERS?.get(Number(id))?.Code||'Sans atelier';
  const rows=()=>M.filter(tables.ACTIVITES||[],state);
  function installData(data){
    tables=data.tables;
    Object.keys(tables).forEach(t=>lookups[t]=new Map(tables[t].map(r=>[r.id,r])));
    snapshotAt=data.capturedAt||new Date().toISOString();
    loaded=true;
    populateFilters();render();
  }
  function setOptions(id,options,selected,placeholder){
    $(id).innerHTML='<option value="">'+placeholder+'</option>'+options.map(o=>'<option value="'+esc(o.value)+'">'+esc(o.label)+'</option>').join('');
    $(id).value=selected;
  }
  function populateFilters(){
    const years=[...new Set((tables.ACTIVITES||[]).map(M.year).filter(Boolean))].sort();
    const now=new Date().getFullYear();
    if(!years.includes(Number(state.planningYear)))state.planningYear=String(years.includes(now)?now:years.at(-1)||now);
    setOptions('filter-year',years.map(y=>({value:y,label:y+' · année civile'})),state.year,'Toutes les années');
    setOptions('filter-workshop',(tables.ATELIERS||[]).map(a=>({value:a.id,label:a.Libelle||a.Code})),state.workshop,'Tous les ateliers');
    setOptions('filter-type',types.map(t=>({value:t,label:t})),state.type,'Tous les types');
    const states=[...new Set((tables.ACTIVITES||[]).map(a=>a.Etat_de_l_action).filter(Boolean))];
    setOptions('filter-status',states.map(s=>({value:s,label:s})),state.status,'Tous les états');
  }
  const kpi=(label,value,unit,note,dark=false)=>'<div class="kpi '+(dark?'dark':'')+'"><div class="kpi-label">'+esc(label)+'<span class="kpi-icon" aria-hidden="true">↗</span></div><div class="kpi-value">'+esc(value)+(unit?'<span class="kpi-unit">'+esc(unit)+'</span>':'')+'</div><div class="kpi-note">'+note+'</div></div>';
  const panel=(title,subtitle,body,extra='',foot='')=>'<section class="panel"><div class="panel-head"><div><h2>'+title+'</h2><p>'+subtitle+'</p></div>'+extra+'</div><div class="panel-body">'+body+'</div>'+(foot?'<div class="panel-foot">'+foot+'</div>':'')+'</section>';
  const legend=()=>'<div class="legend">'+types.map((t,i)=>'<span><i class="dot" style="background:'+colors[i]+'"></i>'+esc(t)+'</span>').join('')+'</div>';
  const badge=s=>'<span class="badge '+(s==='Réalisé'?'done':s==='À venir'||s==='En cours'?'planned':s==='Annulé'?'cancelled':s==='À relancer'||s==='Reporté'?'late':'')+'">'+esc(s||'Sans état')+'</span>';
  const empty=(title,description)=>'<div class="empty"><strong>'+esc(title)+'</strong>'+esc(description)+'</div>';
  function workshopBars(data,metric='count'){
    const groups=M.group(data,'Atelier_organisateur').sort((a,b)=>(metric==='hours'?b.plannedHours-a.plannedHours:b.total-a.total));
    const max=Math.max(1,...groups.map(g=>metric==='hours'?g.plannedHours:g.total));
    return groups.length?'<div class="bar-chart">'+groups.map(g=>{
      const total=metric==='hours'?g.plannedHours:g.total;
      const segments=types.map((t,i)=>{
        const r=g.rows.filter(a=>a.Type_d_activite===t&&a.Etat_de_l_action!=='Annulé');
        const v=metric==='hours'?M.sum(r,'Duree_prevue_h'):g.rows.filter(a=>a.Type_d_activite===t).length;
        return '<span class="bar-segment" style="width:'+(v/max*100)+'%;background:'+colors[i]+'" title="'+esc(t)+' : '+fmt(v,1)+(metric==='hours'?' h':'')+'"></span>';
      }).join('');
      return '<button class="bar-row" data-workshop="'+esc(g.key||'')+'" aria-label="Voir '+esc(workshopName(g.key))+'"><span class="bar-label">'+esc(workshopShort(g.key))+'</span><span class="bar-track">'+segments+'</span><span class="bar-value">'+fmt(total,1)+'</span></button>';
    }).join('')+'</div>':'<div class="chart-empty">Aucune activité dans cette sélection.</div>';
  }
  function basicBars(groups){
    const max=Math.max(1,...groups.map(g=>g.value));
    return groups.length?'<div class="bar-chart">'+groups.map((g,i)=>'<div class="bar-row long"><span class="bar-label" title="'+esc(g.label)+'">'+esc(g.label)+'</span><div class="bar-track"><span class="bar-segment" style="width:'+(g.value/max*100)+'%;background:'+colors[i%colors.length]+'"></span></div><span class="bar-value">'+fmt(g.value,1)+'</span></div>').join('')+'</div>':'<div class="chart-empty">Aucune donnée renseignée pour cette sélection.</div>';
  }
  function overview(data){
    const s=M.summary(data);
    const groups=M.group(data,'Etat_de_l_action').sort((a,b)=>b.total-a.total);
    let cursor=0;
    const gradient=groups.map(g=>{const start=cursor;cursor+=g.total/Math.max(1,s.total)*100;return (statusColors[g.key]||colors[6])+' '+start+'% '+cursor+'%'}).join(',')||'#edf2e9 0% 100%';
    const donut='<div class="donut-wrap"><div class="donut" style="background:conic-gradient('+gradient+')" role="img" aria-label="'+s.done+' activités réalisées sur '+s.total+'"><div class="donut-label"><strong>'+percent(s.done,s.total)+'</strong><span>réalisées</span></div></div><div class="donut-key">'+groups.map(g=>'<div><i class="dot" style="background:'+(statusColors[g.key]||colors[6])+'"></i><span>'+esc(g.key||'Sans état')+'</span><b>'+g.total+'</b></div>').join('')+'</div></div>';
    const top=M.group(data.filter(a=>a.Thematique),'Thematique').sort((a,b)=>b.total-a.total).slice(0,5);
    const alerts=data.filter(a=>a.Relance_COQ_a_prevoir||a.Etat_de_l_action==='À relancer');
    const alertTable=alerts.length?'<div class="table-wrap"><table><thead><tr><th>Activité à suivre</th><th>Atelier</th><th>Référent</th><th>Point de vigilance</th></tr></thead><tbody>'+alerts.slice(0,5).map(a=>'<tr><td><button class="activity-title" data-activity="'+a.id+'">'+esc(a.Titre_de_l_action||'Sans intitulé')+'</button><span class="sub">'+esc(a.Identifiant_activite)+'</span></td><td>'+esc(workshopShort(a.Atelier_organisateur))+'</td><td>'+esc(name('COLLABORATEURS',a.Referent_de_l_action))+'</td><td>'+badge(a.Relance_COQ_a_prevoir?'Relance COQ':a.Etat_de_l_action)+'</td></tr>').join('')+'</tbody></table></div>':empty('Aucune relance signalée','Les indicateurs reflètent uniquement les informations renseignées dans Grist.');
    return '<div class="kpis">'+kpi('Activités enregistrées',fmt(s.total),'','<span class="pill">'+s.active+' en suivi</span>hors réalisées et annulées',true)+kpi('Heures d’activité prévues',fmt(s.plannedHours,1),'h',s.missingPlannedDuration+' durée(s) manquante(s) · hors annulées')+kpi('Activités réalisées',fmt(s.done),'',percent(s.done,s.total)+' des activités sélectionnées')+kpi('Participations réalisées',s.participantsCount?fmt(s.participants):'—','',s.participantsCount+'/'+s.done+' activités réalisées avec effectif')+'</div>'+
      '<div class="grid-two">'+panel('L’activité, atelier par atelier','Nombre d’activités · cliquer sur un atelier pour explorer',legend()+workshopBars(data),'<a class="text-button" href="#view=workshops">Explorer ↗</a>','Attribution à l’atelier organisateur : chaque activité est comptée une seule fois.')+panel('Où en est la programmation ?','Répartition selon l’état renseigné',donut+'<div class="callout">'+(s.alerts?'<strong>'+s.alerts+' activité(s) à relancer.</strong> Consulter les dossiers à suivre ci-dessous.':'Les états permettent de suivre l’avancement de la programmation.')+'</div>')+'</div>'+
      '<div class="grid-equal">'+panel('Les thématiques les plus présentes','Nombre d’activités avec une thématique renseignée',basicBars(top.map(g=>({label:name('THEMATIQUES',g.key),value:g.total}))),'<a href="#view=themes" class="text-button">Tout voir ↗</a>',s.withoutTheme+' activité(s) sans thématique.')+panel('La qualité des informations','Repérer ce qui reste à compléter','<div class="quality-grid"><div class="quality-card"><strong>'+s.undated+'</strong>sans date</div><div class="quality-card"><strong>'+s.withoutTheme+'</strong>sans thématique</div><div class="quality-card"><strong>'+s.missingPlannedDuration+'</strong>sans durée prévue</div><div class="quality-card"><strong>'+s.withoutPartner+'</strong>sans partenaire associé</div><div class="quality-card"><strong>'+s.partners+'</strong>partenaire(s) distinct(s)</div><div class="quality-card"><strong>'+fmt(s.actualHours,1)+' h</strong>réalisées et renseignées</div></div>','','L’absence de partenaire peut être normale, notamment pour une action interne.')+'</div>'+
      '<section class="panel"><div class="panel-head"><div><h2>Les dossiers qui appellent une attention</h2><p>Relances explicites et échéances COQ · '+alerts.length+' activité(s)</p></div><button class="text-button" data-alerts>Ouvrir la liste ↗</button></div>'+alertTable+'</section>';
  }
  function workshops(data){
    const s=M.summary(data);
    const planningYear=Number(state.year||state.planningYear);
    const planningRows=data.filter(a=>M.year(a)===planningYear);
    const workshops=(tables.ATELIERS||[]).filter(w=>!state.workshop||String(w.id)===state.workshop);
    const cells=workshops.map(w=>({w,months:months.map((_,i)=>{const rs=planningRows.filter(a=>a.Atelier_organisateur===w.id&&M.activityDate(a)?.getUTCMonth()===i);return {rows:rs,value:state.metric==='hours'?M.summary(rs).plannedHours:rs.length}})}));
    const max=Math.max(1,...cells.flatMap(c=>c.months.map(m=>m.value)));
    const planning='<div class="table-wrap"><table class="planning"><thead><tr><th>Atelier organisateur</th>'+months.map(m=>'<th>'+m+'</th>').join('')+'</tr></thead><tbody>'+cells.map(c=>'<tr><td><strong>'+esc(c.w.Code)+'</strong><span class="sub">'+esc(c.w.Libelle)+'</span></td>'+c.months.map((m,i)=>'<td><button class="heat" data-month="'+(i+1)+'" data-planning-workshop="'+c.w.id+'" data-planning-year="'+planningYear+'" style="background:rgba(24,125,115,'+(m.value?(.08+m.value/max*.55):.025)+');color:'+(m.value/max>.7?'white':'#17323a')+'" aria-label="'+esc(c.w.Code)+' · '+months[i]+' '+planningYear+' : '+fmt(m.value,1)+(state.metric==='hours'?' heures prévues':' activités')+'">'+(m.value?fmt(m.value,1):'·')+'<small>'+(m.value?(state.metric==='hours'?'h prévues':'activité(s)'):'')+'</small></button></td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    const yearOptions=[...new Set((tables.ACTIVITES||[]).map(M.year).filter(Boolean))].sort();
    const controls='<div class="inline-controls">'+(!state.year?'<select id="planning-year" aria-label="Année du calendrier">'+yearOptions.map(y=>'<option '+(y===planningYear?'selected':'')+'>'+y+'</option>').join('')+'</select>':'')+'<select id="planning-metric" aria-label="Indicateur du calendrier"><option value="hours" '+(state.metric==='hours'?'selected':'')+'>Heures prévues</option><option value="count" '+(state.metric==='count'?'selected':'')+'>Nombre d’activités</option></select></div>';
    const staffCounts=new Map();
    data.forEach(a=>{const ids=new Set([...M.list(a.Intervenants),...(a.Referent_de_l_action?[a.Referent_de_l_action]:[])]);ids.forEach(id=>{if(!staffCounts.has(id))staffCounts.set(id,[]);staffCounts.get(id).push(a)})});
    const staff=[...staffCounts].map(([id,rs])=>({id,rs})).sort((a,b)=>b.rs.length-a.rs.length);
    return '<div class="kpis">'+kpi('Ateliers organisateurs',new Set(data.map(a=>a.Atelier_organisateur).filter(Boolean)).size,'','Ateliers ayant au moins une activité',true)+kpi('Heures prévues',fmt(s.plannedHours,1),'h','Durées d’activité · hors annulées')+kpi('Durée moyenne réalisée',fmt(s.averageDuration,1),'h',s.durationCount+'/'+s.done+' activités réalisées renseignées')+kpi('Personnes mobilisées',staff.length,'','Référents ou intervenants · sans doublon')+'</div>'+
      '<div class="callout warn"><strong>Volume d’activité, pas taux d’occupation.</strong> Les durées ne couvrent pas encore la préparation, la coordination ni la capacité disponible des équipes. Les activités multi-dates sont placées au mois de leur première date.</div>'+
      '<section class="panel"><div class="panel-head"><div><h2>La programmation au fil des mois</h2><p>Année civile '+planningYear+' · cliquer sur une case pour ouvrir les activités</p></div>'+controls+'</div>'+planning+'<div class="panel-foot">'+s.undated+' activité(s) sans date dans la sélection globale. Les heures des activités annulées sont exclues.</div></section>'+
      '<div class="grid-equal section-spacer">'+panel('Volumes d’activité par atelier','Heures prévues · atelier organisateur',legend()+workshopBars(data,'hours'))+panel('Qui est mobilisé ?','Référents et intervenants des activités sélectionnées',staff.length?'<div class="table-wrap"><table><thead><tr><th>Personne</th><th>Rattachement</th><th class="num">Activités</th></tr></thead><tbody>'+staff.map(p=>'<tr><td>'+esc(name('COLLABORATEURS',p.id))+'</td><td>'+esc(workshopShort(lookups.COLLABORATEURS?.get(p.id)?.Rattachements))+'</td><td class="num">'+p.rs.length+'</td></tr>').join('')+'</tbody></table></div>':empty('Aucune personne renseignée','Compléter les référents et les intervenants.'),'','Une participation à une activité n’indique pas le nombre d’heures travaillées par la personne.')+'</div>';
  }
  function partners(data){
    const ids=new Set(data.flatMap(a=>M.list(a.Partenaires)));
    const used=(tables.PARTENAIRES||[]).filter(p=>ids.has(p.id));
    const s=M.summary(data);
    const categories=new Map();
    used.forEach(p=>{const key=p.Categorie||'À catégoriser';if(!categories.has(key))categories.set(key,new Set());data.filter(a=>M.list(a.Partenaires).includes(p.id)).forEach(a=>categories.get(key).add(a.id))});
    const bars=[...categories].map(([label,ids])=>({label,value:ids.size})).sort((a,b)=>b.value-a.value);
    const partnerTable=used.length?'<div class="table-wrap"><table><thead><tr><th>Partenaire</th><th>Catégorie</th><th>Territoire déclaré</th><th>Ateliers organisateurs</th><th class="num">Activités</th></tr></thead><tbody>'+used.map(p=>{const rs=data.filter(a=>M.list(a.Partenaires).includes(p.id));return '<tr><td><strong>'+esc(p.Nom_partenaire)+'</strong></td><td>'+esc(p.Categorie||'À renseigner')+'</td><td>'+esc(p.Territoire||'—')+'</td><td>'+esc([...new Set(rs.map(a=>workshopShort(a.Atelier_organisateur)))].join(', '))+'</td><td class="num">'+rs.length+'</td></tr>'}).join('')+'</tbody></table></div>':empty('Le référentiel reste à alimenter','Associer les partenaires aux activités permettra de lire les relations territoriales.');
    const categoriesAll=[...new Set(used.map(p=>p.Categorie||'À catégoriser'))];
    const workshopTable=categoriesAll.length?'<div class="table-wrap"><table><thead><tr><th>Atelier</th>'+categoriesAll.map(c=>'<th class="num">'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+(tables.ATELIERS||[]).filter(w=>!state.workshop||String(w.id)===state.workshop).map(w=>'<tr><td>'+esc(w.Code)+'</td>'+categoriesAll.map(c=>{const partnerIds=used.filter(p=>(p.Categorie||'À catégoriser')===c).map(p=>p.id);const n=data.filter(a=>a.Atelier_organisateur===w.id&&M.list(a.Partenaires).some(id=>partnerIds.includes(id))).length;return '<td class="num">'+(n||'—')+'</td>'}).join('')+'</tr>').join('')+'</tbody></table></div>':'<div class="chart-empty">Aucune catégorie renseignée.</div>';
    return '<div class="kpis">'+kpi('Partenaires distincts',used.length,'','Sur les activités sélectionnées',true)+kpi('Activités avec partenaires',s.total-s.withoutPartner,'',percent(s.total-s.withoutPartner,s.total)+' de la sélection')+kpi('Catégories représentées',categoriesAll.length,'','Selon le référentiel PARTENAIRES')+kpi('Sans partenaire associé',s.withoutPartner,'','Peut être normal selon le type d’activité')+'</div>'+
      '<div class="callout"><strong>Lecture des partenariats.</strong> Le commanditaire (champ Organisme) et le financeur ne sont pas automatiquement assimilés aux partenaires associés. Une activité impliquant plusieurs catégories apparaît dans chacune : les colonnes ne sont pas additives.</div>'+
      '<div class="grid-equal">'+panel('Avec quels types de partenaires ?','Nombre d’activités par catégorie',basicBars(bars))+panel('Les partenariats selon les ateliers','Nombre d’activités · atelier organisateur',workshopTable)+'</div>'+
      '<section class="panel"><div class="panel-head"><div><h2>Les organismes associés</h2><p>Un même organisme est compté une seule fois parmi les partenaires distincts.</p></div></div>'+partnerTable+'</section>';
  }
  function themes(data){
    const themes=(tables.THEMATIQUES||[]).filter(t=>!state.theme||String(t.id)===state.theme);
    const workshops=(tables.ATELIERS||[]).filter(w=>!state.workshop||String(w.id)===state.workshop);
    const max=Math.max(1,...workshops.flatMap(w=>themes.map(t=>data.filter(a=>a.Atelier_organisateur===w.id&&a.Thematique===t.id).length)));
    const matrix='<div class="table-wrap"><table class="matrix"><thead><tr><th>Atelier</th>'+themes.map(t=>'<th>'+esc(t.Libelle)+'</th>').join('')+'</tr></thead><tbody>'+workshops.map(w=>'<tr><td><strong>'+esc(w.Code)+'</strong></td>'+themes.map(t=>{const n=data.filter(a=>a.Atelier_organisateur===w.id&&a.Thematique===t.id).length;return '<td><button class="heat" data-theme="'+t.id+'" data-theme-workshop="'+w.id+'" aria-label="'+esc(w.Code)+' · '+esc(t.Libelle)+' : '+n+' activités" style="background:rgba(24,125,115,'+(n?.06+n/max*.55:.025)+');color:'+(n/max>.7?'white':'#17323a')+'">'+(n||'·')+'</button></td>'}).join('')+'</tr>').join('')+'</tbody></table></div>';
    const audiences=new Map();
    data.forEach(a=>M.list(a.Cibles).forEach(c=>audiences.set(c,(audiences.get(c)||0)+1)));
    const themeGroups=M.group(data.filter(a=>a.Thematique),'Thematique').sort((a,b)=>b.total-a.total);
    const s=M.summary(data);
    return '<div class="kpis">'+kpi('Thématiques présentes',themeGroups.length,'','Thématiques principales renseignées',true)+kpi('Activités thématisées',s.total-s.withoutTheme,'',percent(s.total-s.withoutTheme,s.total)+' de la sélection')+kpi('Publics représentés',audiences.size,'','Une activité peut viser plusieurs publics')+kpi('Sans thématique',s.withoutTheme,'','À qualifier lorsque pertinent')+'</div>'+
      '<section class="panel"><div class="panel-head"><div><h2>Les thématiques à l’échelle du territoire</h2><p>Nombre d’activités par atelier et thématique principale · cliquer pour explorer</p></div></div>'+matrix+'<div class="panel-foot">Une faible présence n’indique pas à elle seule un besoin non couvert : rapprocher ces données des besoins locaux.</div></section>'+
      '<div class="grid-equal section-spacer">'+panel('Répartition des thématiques','Activités enregistrées',basicBars(themeGroups.map(g=>({label:name('THEMATIQUES',g.key),value:g.total}))))+panel('Les publics visés','Nombre d’activités · réponses multiples',basicBars([...audiences].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value)),'','Les publics visés ne sont pas des effectifs de participants.')+'</div>';
  }
  function activities(data){
    let filtered=data.filter(a=>{const q=state.search.toLocaleLowerCase('fr');return !q||[a.Titre_de_l_action,a.Identifiant_activite,a.Organisme,name('COLLABORATEURS',a.Referent_de_l_action)].join(' ').toLocaleLowerCase('fr').includes(q)});
    filtered.sort((a,b)=>state.sort==='title'?String(a.Titre_de_l_action||'').localeCompare(b.Titre_de_l_action||'','fr'):state.sort==='workshop'?workshopShort(a.Atelier_organisateur).localeCompare(workshopShort(b.Atelier_organisateur),'fr'):((M.activityDate(a)?.valueOf()??Infinity)-(M.activityDate(b)?.valueOf()??Infinity)));
    const perPage=15,pages=Math.max(1,Math.ceil(filtered.length/perPage));state.page=Math.min(state.page,pages);
    const page=filtered.slice((state.page-1)*perPage,state.page*perPage);
    const context=state.month||state.theme||state.alerts?'<div class="callout">Exploration ciblée : '+(state.month?'mois de '+months[Number(state.month)-1]+' · ':'')+(state.theme?'thématique « '+esc(name('THEMATIQUES',Number(state.theme)))+' »':'')+(state.alerts?'dossiers à relancer':'')+' <button class="text-button" id="clear-drill">Effacer ce ciblage</button></div>':'';
    return context+'<section class="panel"><div class="panel-head"><div><h2>Le répertoire des activités</h2><p>'+filtered.length+' résultat(s) · consultation uniquement dans cette première version</p></div></div><div class="table-toolbar"><input class="search" id="activity-search" type="search" placeholder="Rechercher un titre, un référent, un organisme…" aria-label="Rechercher une activité" value="'+esc(state.search)+'"><select id="activity-sort" aria-label="Trier les activités"><option value="date" '+(state.sort==='date'?'selected':'')+'>Par date</option><option value="title" '+(state.sort==='title'?'selected':'')+'>Par intitulé</option><option value="workshop" '+(state.sort==='workshop'?'selected':'')+'>Par atelier</option></select></div>'+
      (page.length?'<div class="table-wrap"><table><thead><tr><th>Activité / type</th><th>Atelier</th><th>Référent</th><th>Date</th><th>État</th><th class="num">Prévu</th><th></th></tr></thead><tbody>'+page.map(a=>'<tr><td><button class="activity-title" data-activity="'+a.id+'">'+esc(a.Titre_de_l_action||'Sans intitulé')+'</button><span class="sub">'+esc(a.Identifiant_activite)+' · '+esc(a.Type_d_activite||'Sans type')+'</span></td><td>'+esc(workshopShort(a.Atelier_organisateur))+'</td><td>'+esc(name('COLLABORATEURS',a.Referent_de_l_action))+'</td><td style="white-space:nowrap">'+esc(date((a.Type_d_activite==='Démarchage'?a.Date_contact:a.Date_prevue)))+'</td><td>'+badge(a.Etat_de_l_action)+'</td><td class="num">'+(M.number(a.Duree_prevue_h)==null?'—':fmt(a.Duree_prevue_h,1)+' h')+'</td><td><button class="text-button" data-activity="'+a.id+'" aria-label="Ouvrir '+esc(a.Titre_de_l_action)+'">↗</button></td></tr>').join('')+'</tbody></table></div>':empty('Aucune activité ne correspond','Modifier les filtres ou la recherche pour élargir la sélection.'))+
      '<div class="pagination"><span>'+(filtered.length?((state.page-1)*perPage+1)+'–'+Math.min(state.page*perPage,filtered.length):0)+' sur '+filtered.length+'</span><div>Page '+state.page+' / '+pages+'<button id="prev-page" '+(state.page===1?'disabled':'')+'>Précédente</button><button id="next-page" '+(state.page===pages?'disabled':'')+'>Suivante</button></div></div></section>';
  }
  const renderers={overview,workshops,partners,themes,activities};
  function render(){
    const def=definitions[state.view];
    $('navigation').innerHTML=Object.entries(definitions).map(([key,d])=>'<a href="#view='+key+'" class="nav-link '+(key===state.view?'active':'')+'" data-nav="'+key+'" '+(key===state.view?'aria-current="page"':'')+' title="'+d.label+'">'+icon(d.icon)+'<span class="nav-text">'+d.label+'</span></a>').join('');
    $('breadcrumb').textContent=def.label;$('page-title').textContent=def.title;$('page-description').textContent=def.description;
    $('eyebrow').textContent=state.workshop?workshopName(Number(state.workshop))+' · VUE FILTRÉE':'DIRECTION TERRITORIALE · GRAND EST';
    if(!loaded)return;
    const data=rows();
    $('selection-count').textContent=data.length+' / '+(tables.ACTIVITES||[]).length+' activités';
    $('content').innerHTML=renderers[state.view](data);
    const embedded=source==='grist';
    $('connection').textContent=embedded?'Connecté à Grist':source==='local'?'Aperçu local · extrait Grist':'Démonstration';
    $('source-notice').hidden=embedded;
    $('source-notice').textContent=source==='local'?'APERÇU LOCAL — Données de votre document au '+new Date(snapshotAt).toLocaleString('fr-FR')+'. Aucune modification possible.':'DÉMONSTRATION — Données entièrement synthétiques. Pour lire votre document, ouvrir cette URL dans un widget personnalisé Grist.';
    $('source-notice').classList.remove('error');
    $('data-footer').textContent=(embedded?'Grist · actualisé le ':source==='local'?'Extrait Grist du ':'Données synthétiques · ')+new Date(snapshotAt).toLocaleDateString('fr-FR')+' · lecture seule · v0.1';
    writeRoute();
    bindContent();
  }
  function bindContent(){
    document.querySelectorAll('[data-activity]').forEach(b=>b.addEventListener('click',()=>openActivity(Number(b.dataset.activity))));
    document.querySelectorAll('[data-workshop]').forEach(b=>b.addEventListener('click',()=>{state.workshop=b.dataset.workshop;state.view='workshops';state.month='';state.theme='';state.page=1;populateFilters();render()}));
    document.querySelectorAll('[data-month]').forEach(b=>b.addEventListener('click',()=>{state.month=b.dataset.month;state.workshop=b.dataset.planningWorkshop;state.year=b.dataset.planningYear;state.view='activities';state.page=1;populateFilters();render()}));
    document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{state.theme=b.dataset.theme;state.workshop=b.dataset.themeWorkshop;state.view='activities';state.page=1;populateFilters();render()}));
    $('planning-year')?.addEventListener('change',e=>{state.planningYear=e.target.value;render()});
    $('planning-metric')?.addEventListener('change',e=>{state.metric=e.target.value;render()});
    $('activity-search')?.addEventListener('input',e=>{state.search=e.target.value;state.page=1;const start=e.target.selectionStart;render();$('activity-search').focus();$('activity-search').setSelectionRange(start,start)});
    $('activity-sort')?.addEventListener('change',e=>{state.sort=e.target.value;state.page=1;render()});
    $('prev-page')?.addEventListener('click',()=>{state.page--;render()});
    $('next-page')?.addEventListener('click',()=>{state.page++;render()});
    $('clear-drill')?.addEventListener('click',()=>{state.month='';state.theme='';state.alerts='';state.page=1;render()});
    document.querySelector('[data-alerts]')?.addEventListener('click',()=>{state.view='activities';state.alerts='1';state.page=1;populateFilters();render()});
  }
  function field(label,value){return '<div><div class="detail-label">'+esc(label)+'</div><div class="detail-value">'+esc(value==null||value===''?'Non renseigné':value)+'</div></div>'}
  function openDrawer(html,label){
    lastFocus=document.activeElement;
    $('drawer').innerHTML='<button class="drawer-close" aria-label="Fermer la fiche">×</button>'+html;
    $('drawer').setAttribute('aria-label',label);
    $('drawer').hidden=false;$('drawer-backdrop').hidden=false;
    document.body.style.overflow='hidden';$('drawer').focus();
    $('drawer').querySelector('.drawer-close').addEventListener('click',closeDrawer);
  }
  function closeDrawer(){$('drawer').hidden=true;$('drawer-backdrop').hidden=true;document.body.style.overflow='';if(lastFocus?.isConnected)lastFocus.focus()}
  function openActivity(id){
    const a=(tables.ACTIVITES||[]).find(a=>a.id===id);if(!a)return;
    const hours=v=>M.number(v)==null?'Non renseignée':fmt(v,1)+' h';
    const partners=M.list(a.Partenaires).map(p=>name('PARTENAIRES',p)).join(', ');
    const people=M.list(a.Intervenants).map(p=>name('COLLABORATEURS',p)).join(', ');
    const associated=M.list(a.Ateliers_associes).map(workshopName).join(', ');
    const eligible=a.Type_d_activite==='Formation PDFC/PrAF';
    const detail='<div class="eyebrow">'+esc(a.Identifiant_activite||'ACTIVITÉ')+' · '+esc(workshopShort(a.Atelier_organisateur))+'</div><h2>'+esc(a.Titre_de_l_action||'Sans intitulé')+'</h2>'+badge(a.Etat_de_l_action)+
      '<h3>Repères de l’activité</h3><div class="detail-grid">'+field('Type',a.Type_d_activite)+field('Référent',name('COLLABORATEURS',a.Referent_de_l_action))+field('Atelier organisateur',workshopName(a.Atelier_organisateur))+field('Ateliers associés',associated)+field('Intervenants',people)+field('Date de référence',date(a.Type_d_activite==='Démarchage'?a.Date_contact:a.Date_prevue))+'</div>'+
      '<h3>Contenu et organisation</h3><div class="detail-grid">'+field('Thématique',name('THEMATIQUES',a.Thematique))+field('Sous-thématique',name('SOUS_THEMATIQUES',a.Sous_thematique))+field('Publics visés',M.list(a.Cibles).join(', '))+field('Format',a.Format)+field('Modalité',a.Modalite)+field('Lieu',a.Lieu_precision||a.Type_lieu)+'</div>'+
      '<h3>Prévision et réalisation</h3><div class="detail-grid">'+field('Durée prévue',hours(a.Duree_prevue_h))+field('Durée réalisée',hours(a.Duree_reelle_h))+field('Participations',a.Effectif_present==null?null:fmt(a.Effectif_present))+field('Statut du parcours',a.Statut_parcours)+'</div>'+
      '<h3>Relations et suivi</h3><div class="detail-grid">'+field('Partenaires associés',partners)+field('Commanditaire',a.Organisme)+field('Date de relance',a.Date_relance?date(a.Date_relance):null)+field('Échéance COQ',a.Date_echeance_COQ?date(a.Date_echeance_COQ):null)+'</div>'+
      (eligible?'<h3>Repères Noticia</h3><div class="detail-grid">'+field('ID notice Noticia',a.ID_offre)+field('ID session Noticia',a.ID_session)+'</div><p>Consulter les informations détaillées directement dans Noticia. Ces identifiants sont facultatifs et ne nécessitent aucun import.</p>':'')+
      '<div class="callout">Cette première version permet la consultation. La modification et les espaces protégés par rôle feront l’objet d’une prochaine étape.</div>';
    openDrawer(detail,'Fiche activité '+a.Identifiant_activite);
  }
  function showDefinitions(){
    openDrawer('<div class="eyebrow">COMPRENDRE LES DONNÉES</div><h2>Des indicateurs lisibles et explicites.</h2>'+
      '<div class="drawer-definition"><strong>Périmètre</strong><p>Les activités enregistrées dans ce dispositif, sur la période sélectionnée. Ce tableau de bord ne constitue pas le bilan exhaustif historique de la DT. Le filtre année utilise la date de contact pour un démarchage et la date prévue pour les autres activités. Une activité sans date est visible seulement dans « Toutes les années ».</p></div>'+
      '<div class="drawer-definition"><strong>Attribution aux ateliers</strong><p>Les volumes sont affectés à l’atelier organisateur, une seule fois par activité. Les ateliers associés figurent dans la fiche mais ne reçoivent pas automatiquement une part des heures. Les filtres d’atelier sont des filtres de consultation : ils ne remplacent pas les droits d’accès Grist.</p></div>'+
      '<div class="drawer-definition"><strong>Heures prévues / heures réalisées</strong><p>Les heures prévues additionnent les durées renseignées, hors activités annulées. Elles comprennent le prévisionnel des activités déjà réalisées. Les heures réalisées concernent seulement les activités à l’état « Réalisé ». Ces durées ne sont ni des heures-agent, ni une mesure de capacité disponible.</p></div>'+
      '<div class="drawer-definition"><strong>Durée moyenne</strong><p>Calcul sur les activités réalisées dont la durée réelle est renseignée. Une valeur manquante est exclue ; un zéro explicite est conservé. Pour interpréter une moyenne, filtrer sur un même type et, à terme, un même format.</p></div>'+
      '<div class="drawer-definition"><strong>Participations</strong><p>Somme des effectifs présents renseignés sur les activités réalisées. Une même personne peut participer à plusieurs activités : il ne s’agit pas d’un nombre de personnes uniques.</p></div>'+
      '<div class="drawer-definition"><strong>Personnes mobilisées</strong><p>Référents et intervenants distincts. Une personne présente dans les deux rôles sur une activité n’est comptée qu’une fois. Le nombre d’activités associées ne mesure pas son temps de travail.</p></div>'+
      '<div class="drawer-definition"><strong>Partenaires et catégories</strong><p>Le référentiel PARTENAIRES constitue la source. Organisme et financeur ne sont pas assimilés aux partenaires. Une activité peut être représentée dans plusieurs catégories : leurs totaux ne s’additionnent pas. Un partenaire sans catégorie figure dans « À catégoriser ».</p></div>'+
      '<div class="drawer-definition"><strong>Programmation mensuelle</strong><p>Les activités sont regroupées à leur première date prévue ou à la date de contact pour un démarchage. Une activité répartie sur plusieurs dates n’est pas ventilée automatiquement. Le calendrier est annuel même lorsque le filtre global couvre toutes les années.</p></div>'+
      '<div class="drawer-definition"><strong>Noticia et droits</strong><p>Aucun import Noticia n’est nécessaire. Seuls les identifiants facultatifs sont affichés pour les formations PDFC-PrAF. Cette v0.1 ne définit pas de nouvelles règles d’accès et ne réalise aucune écriture dans Grist.</p></div>','Définitions des indicateurs');
  }
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,4500)}
  function exportCsv(){
    if(!loaded)return;
    let selected=rows();if(state.view==='activities'&&state.search){const q=state.search.toLocaleLowerCase('fr');selected=selected.filter(a=>[a.Titre_de_l_action,a.Identifiant_activite,a.Organisme,name('COLLABORATEURS',a.Referent_de_l_action)].join(' ').toLocaleLowerCase('fr').includes(q))}
    const text=M.csv(selected,[
      {label:'Identifiant',value:a=>a.Identifiant_activite},{label:'Intitulé',value:a=>a.Titre_de_l_action},
      {label:'Type',value:a=>a.Type_d_activite},{label:'Atelier organisateur',value:a=>workshopName(a.Atelier_organisateur)},
      {label:'Référent',value:a=>name('COLLABORATEURS',a.Referent_de_l_action)},{label:'État',value:a=>a.Etat_de_l_action},
      {label:'Date de référence',value:a=>M.activityDate(a)?.toISOString().slice(0,10)||''},
      {label:'Heures prévues',value:a=>a.Duree_prevue_h},{label:'Heures réalisées',value:a=>a.Duree_reelle_h},
      {label:'Effectif présent',value:a=>a.Effectif_present},{label:'Thématique',value:a=>name('THEMATIQUES',a.Thematique,'')},
      {label:'Partenaires',value:a=>M.list(a.Partenaires).map(p=>name('PARTENAIRES',p)).join(' | ')}
    ]);
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download='pilotage-grand-est-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(selected.length+' activité(s) exportée(s).');
  }
  function columnarRows(table){return (table.id||[]).map((id,i)=>Object.fromEntries(Object.entries(table).map(([key,values])=>[key,values[i]])))}
  const tableNames=['ACTIVITES','ATELIERS','COLLABORATEURS','THEMATIQUES','SOUS_THEMATIQUES','PARTENAIRES'];
  async function refreshLive(){
    if(!live)return;
    $('connection').textContent='Actualisation…';
    try{
      const result=await Promise.all(tableNames.map(async t=>{
        try{return [t,columnarRows(await window.grist.docApi.fetchTable(t))]}
        catch(e){if(t==='PARTENAIRES'||t==='SOUS_THEMATIQUES')return [t,[]];throw e}
      }));
      source='grist';installData({tables:Object.fromEntries(result)});
    }catch(e){showError('Connexion Grist incomplète. Vérifier l’accès du widget au document et la présence des tables ACTIVITES, ATELIERS, COLLABORATEURS et THEMATIQUES. Aucun jeu de démonstration n’est utilisé à la place de vos données.');console.error('Grist read failed',e)}
  }
  function showError(message){
    $('source-notice').hidden=false;$('source-notice').classList.add('error');$('source-notice').textContent=message;$('connection').textContent='Connexion à vérifier';
    if(!loaded)$('content').innerHTML=empty('Les données ne sont pas encore accessibles','Le widget doit être associé au document Grist et autorisé à lire ses tables.');
  }
  function demoData(){
    const codes=['08','10','51','52','54','55','57','67','68','88'];
    const themes=['École inclusive','Numérique éducatif','Bien-être à l’école','Éducation aux médias','Transition écologique','Pratiques pédagogiques'];
    const table={
      ATELIERS:codes.map((c,i)=>({id:i+1,Code:'AC '+c,Libelle:'Atelier Canopé '+c})),
      COLLABORATEURS:codes.flatMap((c,i)=>[1,2].map(j=>({id:i*2+j,Etiquette:'Référent '+c+' · '+j,Rattachements:i+1}))),
      THEMATIQUES:themes.map((t,i)=>({id:i+1,Libelle:t})),SOUS_THEMATIQUES:[],
      PARTENAIRES:[{id:1,Nom_partenaire:'Commune de démonstration',Categorie:'Commune',Territoire:'Territoire exemple'},{id:2,Nom_partenaire:'Association de démonstration',Categorie:'Association',Territoire:'Grand Est'},{id:3,Nom_partenaire:'Conseil départemental de démonstration',Categorie:'Conseil départemental',Territoire:'Département exemple'}],
      ACTIVITES:Array.from({length:84},(_,i)=>{
        const w=(i*7)%10+1,t=types[i%4],done=i%5===0;
        return {id:i+1,Identifiant_activite:'DEMO-'+String(i+1).padStart(3,'0'),Titre_de_l_action:['Accompagner les équipes autour de ','Explorer ','Concevoir un projet sur ','Former aux enjeux de '][i%4]+themes[i%themes.length].toLocaleLowerCase('fr'),Type_d_activite:t,Atelier_organisateur:w,Ateliers_associes:['L'],Referent_de_l_action:(w-1)*2+1,Intervenants:['L',(w-1)*2+1,(w-1)*2+2],Etat_de_l_action:done?'Réalisé':i%13===0?'À relancer':i%11===0?'Annulé':i%7===0?'En cours':i%9===0?'Reporté':'À venir',Date_prevue:i%17===0?null:Date.UTC(2026,Math.floor(i/7),i%24+3)/1000,Date_contact:Date.UTC(2026,Math.floor(i/7),i%24+1)/1000,Thematique:i%12===0?0:i%themes.length+1,Duree_prevue_h:i%9===0?null:[1.5,3,6,12][i%4],Duree_reelle_h:done?(i%3===0?null:[2,3,6][i%3]):null,Effectif_present:done?(i%3===0?null:12+i%20):null,Cibles:['L',['Enseignants 1D','Enseignants 2D','Collectivités'][i%3]],Format:'Formation',Modalite:i%2?'Présence':'Distance',Partenaires:i%3===0?['L',i%9===0?3:i%2+1]:['L'],Organisme:'Organisme de démonstration',ID_offre:'',ID_session:'',Relance_COQ_a_prevoir:false};
      })
    };
    return {tables:table,capturedAt:new Date().toISOString()};
  }
  async function init(){
    render();
    $('filters').addEventListener('submit',e=>e.preventDefault());
    ['year','workshop','type','status'].forEach(k=>$('filter-'+k).addEventListener('change',e=>{state[k]=e.target.value;state.page=1;render()}));
    $('reset').addEventListener('click',()=>{['year','workshop','type','status','theme','month','alerts','search'].forEach(k=>state[k]='');state.page=1;populateFilters();render()});
    $('navigation').addEventListener('click',e=>{const link=e.target.closest('[data-nav]');if(!link)return;e.preventDefault();state.view=link.dataset.nav;state.month='';state.theme='';state.alerts='';state.search='';state.page=1;render();window.scrollTo(0,0)});
    document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#view="]');if(a&&!a.dataset.nav){e.preventDefault();state.view=new URLSearchParams(a.hash.slice(1)).get('view');state.month='';state.theme='';state.page=1;render()}});
    $('methodology').addEventListener('click',showDefinitions);$('definitions').addEventListener('click',showDefinitions);$('drawer-backdrop').addEventListener('click',closeDrawer);
    document.addEventListener('keydown',e=>{
      if($('drawer').hidden)return;
      if(e.key==='Escape')closeDrawer();
      if(e.key==='Tab'){const focusable=[...$('drawer').querySelectorAll('button,a[href],input,select,[tabindex="0"]')];if(!focusable.length){e.preventDefault();return}const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('drawer'))){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
    });
    $('export').addEventListener('click',exportCsv);
    $('refresh').addEventListener('click',()=>live?refreshLive():loadPreview());
    window.addEventListener('hashchange',()=>{readRoute();populateFilters();render()});
    const params=new URLSearchParams(location.search);
    if(window.parent===window||params.get('mode')==='demo'){
      await loadPreview();return;
    }
    const sdk=document.createElement('script');sdk.src='https://docs.getgrist.com/grist-plugin-api.js';
    sdk.onload=()=>{
      live=true;
      // Grist requires full access to read multiple tables. This widget only calls fetchTable.
      window.grist.ready({requiredAccess:'full'});
      window.grist.onOptions((options,interaction)=>{if(interaction?.access_level==='full'||interaction?.accessLevel==='full')refreshLive()});
      let timer;
      window.grist.onRecords(()=>{clearTimeout(timer);timer=setTimeout(refreshLive,150)});
      refreshLive();
    };
    sdk.onerror=()=>showError('L’API des widgets Grist n’a pas pu être chargée. Vérifier la connexion réseau et les autorisations de cette instance.');
    document.head.appendChild(sdk);
  }
  async function loadPreview(){
    const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview')==='local';
    if(local){
      try{const response=await fetch('../preview/data/snapshot.json',{cache:'no-store'});if(!response.ok)throw Error(response.status);const data=await response.json();source='local';installData(data);return}catch(e){showError('L’extrait local n’est pas disponible. Charger la page sans le paramètre preview pour ouvrir la démonstration.');return}
    }
    source='demo';installData(demoData());
  }
  init().catch(e=>{showError('Le widget n’a pas pu démarrer. Actualiser la page ou consulter le guide d’installation.');console.error(e)});
})();
