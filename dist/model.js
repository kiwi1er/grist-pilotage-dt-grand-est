/* Pure calculations shared by the UI and the checks. No network or document writes. */
(function(root){
  'use strict';
  const list=v=>Array.isArray(v)?v.filter(x=>x!=='L'&&x!=null&&x!==0):[];
  const number=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
  const sum=(rows,key)=>rows.reduce((s,r)=>s+(number(r[key])??0),0);
  function date(v){
    if(v==null||v==='')return null;
    const d=typeof v==='number'?new Date(v*1000):new Date(v);
    return Number.isFinite(d.valueOf())?d:null;
  }
  const activityDate=a=>date(a.Type_d_activite==='Démarchage'?a.Date_contact:a.Date_prevue);
  const year=a=>activityDate(a)?.getUTCFullYear()??null;
  const matches=(value,selected)=>!selected||String(selected).split("|").includes(String(value));
  function teamMembers(people,workshop){
    return people.filter(p=>matches(p.Rattachements,workshop)).map(p=>String(p.id));
  }
  function cooperations(rows,people){
    const homes=new Map(people.map(p=>[String(p.id),p.Rattachements]));
    const edges=new Map();
    rows.filter(a=>a.Etat_de_l_action!=='Annulé'&&a.Atelier_organisateur).forEach(a=>{
      const contributors=new Set([a.Referent_de_l_action,...list(a.Intervenants)].map(id=>homes.get(String(id))).filter(id=>id&&String(id)!==String(a.Atelier_organisateur)));
      contributors.forEach(from=>{
        const key=String(from)+'>'+a.Atelier_organisateur;
        if(!edges.has(key))edges.set(key,{from,to:a.Atelier_organisateur,rows:[]});
        edges.get(key).rows.push(a);
      });
    });
    return [...edges.values()];
  }
  function filter(rows,f){
    return rows.filter(a=>(!f.year||String(year(a))===String(f.year))
      &&(f.scope==='team'?((f.teamIds||[]).some(id=>String(a.Referent_de_l_action)===String(id)||list(a.Intervenants).some(v=>String(v)===String(id)))):matches(a.Atelier_organisateur,f.workshop))
      &&matches(a.Type_d_activite,f.type)
      &&matches(a.Etat_de_l_action,f.status)
      &&(!f.person||matches(a.Referent_de_l_action,f.person)||list(a.Intervenants).some(id=>matches(id,f.person)))
      &&(!f.theme||String(a.Thematique)===String(f.theme))
      &&(!f.month||(activityDate(a)&&String(activityDate(a).getUTCMonth()+1)===String(f.month)))
      &&(!f.fromDate||(activityDate(a)&&activityDate(a)>=date(f.fromDate)))
      &&(!f.toDate||(activityDate(a)&&activityDate(a)<=date(f.toDate)))
      &&(!f.alerts||a.Relance_COQ_a_prevoir||a.Etat_de_l_action==='À relancer'));
  }
  function summary(rows){
    const done=rows.filter(a=>a.Etat_de_l_action==='Réalisé');
    const active=rows.filter(a=>!['Réalisé','Annulé'].includes(a.Etat_de_l_action));
    const planned=rows.filter(a=>a.Etat_de_l_action!=='Annulé');
    const durationRows=done.filter(a=>number(a.Duree_reelle_h)!==null);
    const durations=durationRows.map(a=>a.Duree_reelle_h).sort((a,b)=>a-b);
    const participantsRows=done.filter(a=>number(a.Effectif_present)!==null);
    const partnerIds=new Set(rows.flatMap(a=>list(a.Partenaires)));
    return {
      total:rows.length,done:done.length,active:active.length,
      plannedHours:sum(planned,'Duree_prevue_h'),actualHours:sum(done,'Duree_reelle_h'),
      participants:sum(done,'Effectif_present'),partners:partnerIds.size,
      durationCount:durationRows.length,participantsCount:participantsRows.length,
      averageDuration:durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:null,
      medianDuration:durations.length?(durations[Math.floor((durations.length-1)/2)]+durations[Math.ceil((durations.length-1)/2)])/2:null,
      undated:rows.filter(a=>!activityDate(a)).length,
      withoutPartner:rows.filter(a=>!list(a.Partenaires).length).length,
      withoutTheme:rows.filter(a=>!a.Thematique).length,
      missingPlannedDuration:planned.filter(a=>number(a.Duree_prevue_h)===null).length,
      alerts:rows.filter(a=>a.Relance_COQ_a_prevoir||a.Etat_de_l_action==='À relancer').length
    };
  }
  function group(rows,key){
    const groups=new Map();
    rows.forEach(a=>{const k=typeof key==='function'?key(a):a[key];if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a)});
    return [...groups].map(([key,rows])=>({key,rows,...summary(rows)}));
  }
  function csv(rows,columns){
    const cell=v=>{
      let text=String(v??'');
      if(typeof v==='string'&&(/^\s*[=+\-@]/.test(text)||/^[\t\r\n]/.test(text)))text="'"+text;
      return '"'+text.replace(/"/g,'""')+'"';
    };
    return '\uFEFF'+[columns.map(c=>cell(c.label)).join(';'),...rows.map(r=>columns.map(c=>cell(c.value(r))).join(';'))].join('\r\n');
  }
  const model={cooperations,teamMembers,matches,list,number,sum,date,activityDate,year,filter,summary,group,csv};
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
  root.PilotageModel=model;
})(typeof globalThis!=='undefined'?globalThis:this);
