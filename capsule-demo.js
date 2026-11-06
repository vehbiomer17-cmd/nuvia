'use strict';
// Explicit UI demonstration only: no real codes, secure PINs, or database writes.
window.CapsuleDemo = {
 create(clock=()=>Date.now()) {
  let reservation=null,consumed=false;
  return {
   verify(code,serial){
    code=String(code).trim().toUpperCase();
    const errors={'DEMO-USADA':'Esta cápsula de muestra ya fue consumida.','DEMO-VENCIDA':'Esta cápsula de muestra está vencida.','DEMO-REVOCADA':'Esta cápsula de muestra fue revocada.'};
    if(errors[code])throw new Error(errors[code]);
    if(code!=='DEMO-VALIDA')throw new Error('Código de demostración no válido. Usá uno de los ejemplos indicados.');
    if(consumed)throw new Error('Esta cápsula de muestra ya fue consumida.');
    if(reservation&&reservation.expires>clock())throw new Error('La cápsula de muestra ya tiene un PIN activo.');
    reservation={expires:clock()+300000};
    return {ok:true,pin:'1234',authorization_id:'demostracion',expires_at:new Date(reservation.expires).toISOString(),batch:'DEMO-ESCOLAR',device:serial||'DEMO-01'};
   },
   status(){return {state:consumed?'consumed':reservation&&reservation.expires>clock()?'reserved':'expired'};},
   consume(){if(!reservation||reservation.expires<=clock()||consumed)throw new Error('No hay una reserva de muestra activa.');consumed=true;return {state:'consumed'};}
  };
 }
};
