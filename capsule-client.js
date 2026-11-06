'use strict';
window.CapsuleAPI = {
 async call(action,values={},admin=false) {
  if(!Glunova.configured)throw new Error('Completá la configuración de Supabase para usar el servicio real.');
  const headers={'Content-Type':'application/json','apikey':Glunova.config.SUPABASE_PUBLISHABLE_KEY};
  if(admin){
   const db=await Glunova.client();const {data:{session},error}=await db.auth.getSession();
   if(error||!session)throw new Error('Ingresá con una cuenta de administrador.');
   headers.Authorization=`Bearer ${session.access_token}`;
  }
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(Glunova.config.SUPABASE_URL.replace(/\/$/,'')+'/functions/v1/capsule-api',{
    method:'POST',headers,body:JSON.stringify({...values,action}),signal:controller.signal,cache:'no-store'
   });
   let data;try{data=await response.json();}catch{throw new Error('El servicio real no está disponible. Verificá el despliegue de capsule-api.');}
   if(!response.ok||!data.ok)throw new Error(data.message||'El servicio real no está disponible. No se generó ningún PIN.');
   return data;
  }catch(error){
   if(error.name==='AbortError'||error instanceof TypeError)throw new Error('No se pudo confirmar la operación. Si solicitaste un PIN, puede existir una reserva: esperá hasta 5 minutos antes de reintentar.');
   throw error;
  }finally{clearTimeout(timer);}
 }
};
