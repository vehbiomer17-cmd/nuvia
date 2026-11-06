'use strict';
(() => {
 const $=id=>document.getElementById(id);
 if(!$('capsule-form'))return;
 const demo=CapsuleDemo.create();let mode=Glunova.config.CAPSULE_MODE==='live'?'live':'demo',active=null,timer=null,revision=0,busy=false;
 const messages={consumed:'El detector confirmó la autorización. La cápsula quedó registrada como consumida y no puede volver a activarse.',expired:'El PIN venció. La cápsula no fue consumida por este vencimiento. Podés volver a validarla si sigue vigente.',revoked:'La autorización fue revocada. No utilices esta cápsula.',blocked:'La autorización fue bloqueada por intentos fallidos. Esperá 15 minutos antes de volver a intentar.'};
 function notice(text,error=false){$('capsule-message').textContent=text;$('capsule-message').classList.toggle('is-error',error);}
 function clear(){revision++;active=null;clearTimeout(timer);$('capsule-result').hidden=true;$('capsule-pin').textContent='';$('capsule-consume-demo').hidden=true;}
 function setMode(){
  clear();$('capsule-mode').value=mode;
  $('capsule-demo-note').hidden=mode!=='demo';$('capsule-live-note').hidden=mode!=='live';
  $('capsule-code').placeholder=mode==='demo'?'DEMO-VALIDA':'GLN…';
  $('capsule-device').required=mode==='live';
  notice(mode==='demo'?'Demostración local: no consulta ni modifica cápsulas reales. Los datos se reinician al recargar.':'Servicio real: requiere un detector registrado y el backend desplegado.');
 }
 async function updateStatus(){
  if(!active)return;
  const current=active,version=revision;
  if(Date.now()>=Date.parse(current.expires_at)){clear();notice(messages.expired);return;}
  try{
   const result=mode==='demo'?demo.status():await CapsuleAPI.call('status',{authorization_id:current.authorization_id,status_token:current.status_token});
   if(version!==revision)return;
   if(result.state!=='reserved'){clear();notice((mode==='demo'?'SIMULACIÓN: ':'')+(messages[result.state]||'La autorización ya no está activa.'));return;}
   $('capsule-countdown').textContent=`Vence en ${Math.max(0,Math.ceil((Date.parse(current.expires_at)-Date.now())/1000))} segundos.`;
  }catch(error){if(version===revision){clear();notice('No pudimos comprobar si el PIN sigue activo. No lo utilices hasta verificar el estado. '+error.message,true);}return;}
  timer=setTimeout(updateStatus,10000);
 }
 $('capsule-mode').addEventListener('change',event=>{mode=event.target.value;setMode();});
 $('capsule-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  if(active&&Date.now()<Date.parse(active.expires_at)){notice('Ya tenés un PIN activo. Usalo en el detector indicado o esperá su vencimiento.');return;}
  busy=true;clear();const version=revision;
  const button=$('capsule-submit');button.disabled=true;notice('Validando cápsula…');
  try{
   const code=$('capsule-code').value.trim(),serial=$('capsule-device').value.trim().toUpperCase();
   const result=mode==='demo'?demo.verify(code,serial):await CapsuleAPI.call('verify',{code,device_serial:serial});
   if(version!==revision)return;
   active=result;$('capsule-result').hidden=false;$('capsule-pin').textContent=result.pin;
   $('capsule-reservation').textContent=`Lote ${result.batch} · Detector ${result.device}`;
   $('capsule-consume-demo').hidden=mode!=='demo';
   notice(mode==='demo'?'PIN de muestra: 1234. No autoriza ningún detector real.':'Cápsula reservada. Todavía no está consumida.');
   $('capsule-result').focus();await updateStatus();
  }catch(error){if(version===revision)notice(error.message,true);}finally{busy=false;button.disabled=false;}
 });
 $('capsule-consume-demo').addEventListener('click',()=>{
  try{demo.consume();clear();notice('SIMULACIÓN: cápsula de muestra consumida. No se contactó ningún detector ni se modificó la base de datos.');}catch(error){notice(error.message,true);}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);}else if(active){clearTimeout(timer);updateStatus();}});
 setMode();
})();
