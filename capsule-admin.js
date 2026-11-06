'use strict';
(() => {
 const $=id=>document.getElementById(id),e=Glunova.escape;
 if(!$('capsule-admin'))return;
 let snapshot={batches:[],capsules:[],devices:[],events:[]},offset=0,busy=false,epoch=0;
 const states={available:'Disponible',reserved:'Reservada',consumed:'Consumida',expired:'Vencida',revoked:'Revocada'};
 const kinds={batch_created:'Lote creado',batch_notes_updated:'Notas actualizadas',issued:'Código emitido',device_created:'Detector registrado',device_revoked:'Detector revocado',batch_revoked:'Lote revocado',capsule_revoked:'Cápsula revocada',reserved:'PIN emitido / reserva',reservation_expired:'Reserva vencida',pin_rejected:'PIN rechazado',consumed:'Autorización confirmada / consumida'};
 const time=value=>value?new Date(value).toLocaleString('es-AR'):'—';
 function message(value,error=false){$('capsule-admin-message').textContent=value;$('capsule-admin-message').classList.toggle('error',error);}
 function showEvents(events){$('capsule-events').innerHTML=events.length?events.map(row=>`<article class="admin-item"><strong>${e(kinds[row.kind]||'Evento registrado')}</strong><span>${e(time(row.created_at))} · ${e(row.device_serial||'Sin detector')}</span><small>Responsable: ${e(({system:'Sistema',public:'Visitante',device:'Detector'})[row.actor]||row.actor||'—')} · Cápsula: ${e(row.capsule_id||'—')} · Lote: ${e(row.batch_id||'—')}</small><p>${e(row.detail||'')}</p></article>`).join(''):'Todavía no hay eventos.';}
 function download(value,type,filename){const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function wipe(){epoch++;$('capsule-secrets').hidden=true;$('capsule-export').value='';$('capsule-export').dataset.kind='';}
 window.CapsuleAdmin={hide(){wipe();$('capsule-admin').hidden=true;$('content-layout').hidden=false;$('capsules-tab').setAttribute('aria-pressed','false');},reset(){this.hide();snapshot={batches:[],capsules:[],devices:[],events:[]};['capsule-batches','capsule-records','capsule-devices','capsule-events'].forEach(id=>$(id).replaceChildren());}};
 async function api(action,values={}){
  const version=epoch;const data=await CapsuleAPI.call(action,values,true);
  if(version!==epoch||$('capsule-admin').hidden)throw new Error('La sesión o la vista cambió durante la operación. Volvé a ingresar y revisá los registros.');
  return data;
 }
 async function run(task){
  if(busy)return;busy=true;const buttons=[...document.querySelectorAll('#dashboard button')];buttons.forEach(b=>b.disabled=true);
  try{await task();}catch(error){message(error.message,true);}finally{busy=false;buttons.forEach(b=>b.disabled=false);}
 }
 async function load(){
  const version=epoch;
  const data=await api('overview',{offset,...($('capsule-batch-filter').value?{batch_id:$('capsule-batch-filter').value}:{})},true);
  if(version!==epoch)return;
  snapshot=data;
  for(const id of ['capsule-issue-batch','capsule-notes-batch','capsule-batch-filter']){
   const old=$(id).value;
   $(id).innerHTML=(id==='capsule-batch-filter'?'<option value="">Todos los lotes</option>':'<option value="">Elegí un lote</option>')+data.batches.map(b=>`<option value="${e(b.id)}">${e(b.batch_code)}${b.revoked_at?' (revocado)':''}</option>`).join('');
   $(id).value=old;
  }
  $('capsule-batches').innerHTML=data.batches.length?data.batches.map(b=>`<article class="admin-item"><strong>${e(b.batch_code)}${b.revoked_at?' · Revocado':''}</strong><span>Fabricación: ${e(b.manufactured_on)} · Vence: ${e(time(b.expires_at))}</span><span>Perfil de calibración: ${e(b.calibration_profile)}</span><p>${e(b.notes)}</p>${b.revoked_at?`<p>Motivo: ${e(b.revocation_reason)}</p>`:`<button type="button" data-revoke-batch="${e(b.id)}">Revocar lote</button>`}</article>`).join(''):'No hay lotes registrados.';
  $('capsule-records').innerHTML=data.capsules.length?data.capsules.map(c=>`<tr><td>…${e(c.code_suffix)}<small>${e(c.id)}</small></td><td>${e(c.batch_code)}</td><td>${e(states[c.status]||'Desconocido')}</td><td><button type="button" data-history="${e(c.id)}">Historial</button>${['consumed','revoked'].includes(c.status)?'':`<button type="button" data-revoke-capsule="${e(c.id)}">Revocar</button>`}</td></tr>`).join(''):'<tr><td colspan="4">No hay cápsulas en esta página.</td></tr>';
  $('capsule-page').textContent=`Registros ${offset+1}–${offset+data.capsules.length}. Hasta 200 por página.`;
  $('capsule-devices').innerHTML=data.devices.length?data.devices.map(d=>`<article class="admin-item"><strong>${e(d.serial)} · ${e(d.label)}</strong><span>${d.revoked_at?'Revocado':d.locked_until&&Date.parse(d.locked_until)>Date.now()?'Bloqueado hasta '+e(time(d.locked_until)):'Habilitado'}</span>${d.revoked_at?'':`<button type="button" data-revoke-device="${e(d.serial)}">Revocar detector</button>`}</article>`).join(''):'No hay detectores registrados.';
  showEvents(data.events);
 }
 $('capsules-tab').addEventListener('click',()=>run(async()=>{
  wipe();$('content-layout').hidden=true;$('capsule-admin').hidden=false;$('capsules-tab').setAttribute('aria-pressed','true');
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.add('secondary');b.setAttribute('aria-pressed','false');});
  message('Cargando el servicio real de cápsulas…');await load();message('Datos reales de Supabase. No se muestran códigos completos ni PINs guardados.');
 }));
 $('capsule-refresh').addEventListener('click',()=>run(async()=>{await load();message('Datos actualizados.');}));
 $('capsule-next').addEventListener('click',()=>run(async()=>{if(snapshot.capsules.length<200)return;offset+=200;await load();}));
 $('capsule-prev').addEventListener('click',()=>run(async()=>{offset=Math.max(0,offset-200);await load();}));
 $('capsule-batch-filter').addEventListener('change',()=>run(async()=>{offset=0;await load();}));
 $('capsule-batch-form').addEventListener('submit',event=>{event.preventDefault();return run(async()=>{
  const v=new FormData(event.target);const values=Object.fromEntries(v.entries());values.expires_at=new Date(values.expires_at).toISOString();
  await api('create_batch',values,true);event.target.reset();await load();message('Lote creado. La fecha de vencimiento y el perfil de calibración quedan fijados para mantener la trazabilidad.');
 });});
 $('capsule-notes-form').addEventListener('submit',event=>{event.preventDefault();return run(async()=>{
  await api('update_batch',Object.fromEntries(new FormData(event.target)),true);await load();message('Notas del lote actualizadas.');
 });});
 $('capsule-notes-batch').addEventListener('change',()=>{$('capsule-notes').value=snapshot.batches.find(b=>b.id===$('capsule-notes-batch').value)?.notes||'';});
 $('capsule-issue-form').addEventListener('submit',event=>{event.preventDefault();return run(async()=>{
  wipe();const v=new FormData(event.target);const data=await api('issue',{batch_id:v.get('batch_id'),count:Number(v.get('count'))},true);
  $('capsule-export').value='codigo,lote_id,capsula_id\r\n'+data.codes.map((code,i)=>`${code},${v.get('batch_id')},${data.capsules?.[i]?.id||''}`).join('\r\n');
  $('capsule-export').dataset.kind='codes';$('capsule-secrets').hidden=false;
  message('Códigos generados. Descargalos ahora para imprimirlos: el servidor solo conserva sus hashes y no puede recuperarlos.');await load();
 });});
 $('capsule-device-form').addEventListener('submit',event=>{event.preventDefault();return run(async()=>{
  wipe();const data=await api('create_device',Object.fromEntries(new FormData(event.target)),true);
  $('capsule-export').value=JSON.stringify({serial:data.serial,device_key:data.device_key},null,2);$('capsule-export').dataset.kind='device';$('capsule-secrets').hidden=false;
  event.target.reset();message('Credencial del detector creada. Descargala y provisioná el dispositivo por un canal privado; nunca la publiques en GitHub.');await load();
 });});
 $('capsule-download').addEventListener('click',()=>{
  const isDevice=$('capsule-export').dataset.kind==='device';
  download($('capsule-export').value,isDevice?'application/json':'text/csv;charset=utf-8',isDevice?'glunova-device-credentials.json':'glunova-capsule-codes.csv');
 });
 $('capsule-clear-secrets').addEventListener('click',wipe);
 $('capsule-admin').addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.history)return run(async()=>{const result=await api('history',{capsule_id:b.dataset.history},true);showEvents(result.events);message('Historial de la cápsula seleccionada (hasta 200 eventos recientes).');$('capsule-events').scrollIntoView({behavior:'smooth'});});
  const batch=b.dataset.revokeBatch,capsule=b.dataset.revokeCapsule,device=b.dataset.revokeDevice;
  if(!batch&&!capsule&&!device)return;
  const reason=$('capsule-revoke-reason').value.trim();if(!reason){message('Indicá un motivo antes de revocar.',true);$('capsule-revoke-reason').focus();return;}
  if(!window.confirm('¿Confirmás la revocación permanente? También se cancelarán las reservas pendientes afectadas.'))return;
  return run(async()=>{
   const action=batch?'revoke_batch':capsule?'revoke_capsule':'revoke_device';
   await api(action,{reason,...(batch?{batch_id:batch}:capsule?{capsule_id:capsule}:{serial:device})},true);
   await load();message('Revocación registrada.');
  });
 });
})();
