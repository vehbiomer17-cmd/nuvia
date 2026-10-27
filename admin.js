'use strict';
(async () => {
 const {escape:e, imageURL, client, adminURL} = Glunova;
 const $ = id => document.getElementById(id);
 let db, table='experiences', editing=null, rows=[], authorized=false, generation=0, recovering=false, busy=false;
 const recoveryRequested = new URLSearchParams(location.search).get('recovery') === '1';
 const fields = {
  experiences:[['name','Autor'],['avatar_url','URL de la foto del autor','url',false],['place','Nombre del lugar'],['neighborhood','Barrio / ciudad'],['address','Dirección completa para Google Maps'],['category','Tipo de lugar'],['title','Título'],['text','Resumen de la experiencia','textarea'],['story','Experiencia completa','textarea'],['visit','Tipo de visita'],['order_text','Qué pidió o compró'],['highlights','Lo que le gustó (un punto por línea)','textarea'],['tip','Consejo para la visita','textarea'],['rating','Calificación (1–5)','number'],['image_url','URL de la imagen','url',false]],
  products:[['name','Nombre'],['description','Descripción','textarea'],['price','Precio en ARS','number'],['type','Presentación','select'],['badge','Etiqueta','text',false],['image_url','URL de la imagen','url',false]]
 };
 function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
 function editor(row=null){
  editing=row?.id??null;
  $('editor-title').textContent=(row?'Editar ':table==='products'?'Nuevo ':'Nueva ')+(table==='products'?'producto':'experiencia');
  $('content-form').innerHTML=fields[table].map(([name,label,type='text',required=true])=>{
   let value=row?.[name]??(name==='rating'?5:''); if(Array.isArray(value))value=value.join('\n');
   const attrs=`name="${name}" ${required?'required':''}`;
   let control;
   if(type==='textarea')control=`<textarea ${attrs} maxlength="10000">${e(value)}</textarea>`;
   else if(type==='select')control=`<select ${attrs}>${[['device','Dispositivo'],['kit','Kit'],['capsules','Cápsulas']].map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join('')}</select>`;
   else control=`<input ${attrs} type="${type}" value="${e(value)}" ${type==='number'?(name==='rating'?'min="1" max="5" step="1"':'min="0" max="100000000" step="0.01"'):'maxlength="2000"'}>`;
   return `<label>${label}${control}</label>`;
  }).join('')+`<label>Subir imagen (JPEG, PNG o WebP; hasta 5 MB)<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp"></label><p class="admin-help">Una imagen subida reemplaza la URL. Las imágenes son públicas; usá únicamente material que puedas publicar.</p><label>Orden de aparición<input name="sort_order" type="number" min="0" max="1000000" step="1" value="${e(row?.sort_order??0)}" required></label>${table==='experiences'?`<label><input name="illustrative" type="checkbox" ${row?.illustrative?'checked':''}> Experiencia ilustrativa / ficticia</label>`:''}<label><input name="published" type="checkbox" ${row?.published?'checked':''}> Publicar en el sitio</label><button class="button" type="submit">Guardar ${row?'cambios':'contenido'}</button><button class="button secondary" type="button" id="new-entry">Nuevo / cancelar edición</button>`;
 }
 async function load(){
  const current=++generation, currentTable=table;
  $('content-list').textContent='Cargando…';
  const {data,error}=await db.from(currentTable).select('*').order('sort_order').order('created_at');
  if(current!==generation||!authorized)return;
  if(error){$('content-list').textContent='No se pudo cargar el contenido.';throw error;}
  rows=data;
  $('list-title').textContent=table==='products'?'Productos':'Experiencias';
  $('content-list').innerHTML=rows.length?rows.map((row,i)=>`<article class="admin-item"><strong>${e(row.title||row.name)}</strong><span>${row.published?'Publicado':'Borrador'} · Orden ${e(row.sort_order)}</span><button data-edit="${i}">Editar</button><button data-publish="${i}">${row.published?'Despublicar':'Publicar'}</button></article>`).join(''):'Todavía no hay contenido. Creá la primera entrada.';
 }
 async function checkAccess(){
  const current=++generation;
  authorized=false;$('dashboard').hidden=true;$('login-panel').hidden=true;$('recovery-panel').hidden=true;
  const {data:{user},error}=await db.auth.getUser();
  if(current!==generation)return;
  if(error||!user){$('logout').hidden=true;$('content-list').replaceChildren();$('content-form').replaceChildren();$('login-panel').hidden=false;status(recoveryRequested?'Abrí un enlace de recuperación válido para cambiar tu contraseña.':'Ingresá con tu cuenta de administrador.');return;}
  $('logout').hidden=false;
  const result=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(current!==generation)return;
  if(result.error||!result.data){status('Esta cuenta no tiene permisos de administrador.',true);return;}
  authorized=true;
  if(recovering||recoveryRequested){$('recovery-panel').hidden=false;status('Elegí una nueva contraseña.');return;}
  $('dashboard').hidden=false;editor();await load();status(`Sesión iniciada: ${user.email}`);
 }
 async function run(task,form){
  if(busy)return;busy=true;
  const buttons=[...(form||document).querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  try{await task();}catch(error){status(error.message||'No se pudo completar la operación. Intentá nuevamente.',true);}finally{busy=false;buttons.forEach(b=>b.disabled=false);}
 }
 $('login-form').addEventListener('submit',event=>{event.preventDefault();return run(async()=>{
  const form=event.target,values=new FormData(form);status('Ingresando…');
  const {error}=await db.auth.signInWithPassword({email:values.get('email').trim(),password:values.get('password')});
  form.elements.password.value='';if(error)throw new Error('No se pudo ingresar. Revisá el correo y la contraseña.');
  await checkAccess();
 },event.target);});
 $('forgot').addEventListener('click',()=>run(async()=>{
  const input=$('login-form').elements.email;if(!input.reportValidity())return;
  const {error}=await db.auth.resetPasswordForEmail(input.value.trim(),{redirectTo:adminURL()+'?recovery=1'});
  if(error)throw error;status('Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.');
 },$('login-form')));
 $('recovery-form').addEventListener('submit',event=>{event.preventDefault();return run(async()=>{
  const values=new FormData(event.target);if(values.get('password')!==values.get('confirmation'))throw new Error('Las contraseñas no coinciden.');
  const {error}=await db.auth.updateUser({password:values.get('password')});if(error)throw error;
  event.target.reset();history.replaceState(null,'',location.pathname);recovering=false;
  await db.auth.signOut();location.replace(location.pathname);
 },event.target);});
 $('logout').addEventListener('click',()=>run(async()=>{const {error}=await db.auth.signOut();if(error)throw error;await checkAccess();}));
 document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>run(async()=>{
  table=button.dataset.tab;
  document.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-pressed',String(b===button));b.classList.toggle('secondary',b!==button);});
  editor();await load();status('Contenido actualizado.');
 })));
 $('content-form').addEventListener('click',event=>{if(event.target.id==='new-entry')editor();});
 $('content-list').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||!authorized)return;
  if(button.hasAttribute('data-edit')){editor(rows[button.dataset.edit]);$('editor-title').scrollIntoView({behavior:'smooth'});}
  if(button.hasAttribute('data-publish'))return run(async()=>{
   const row=rows[button.dataset.publish];
   const {error}=await db.from(table).update({published:!row.published}).eq('id',row.id).select('id').single();if(error)throw error;
   if(editing===row.id)editor({...row,published:!row.published});await load();status('Publicación actualizada.');
  });
 });
 $('content-form').addEventListener('submit',event=>{event.preventDefault();return run(async()=>{
  if(!authorized)throw new Error('Ingresá como administrador.');
  const form=event.target,values=new FormData(form),payload={};
  for(const [name,,type='text'] of fields[table]){
   const value=String(values.get(name)||'').trim();
   payload[name]=name==='highlights'?value.split('\n').map(v=>v.trim()).filter(Boolean):type==='number'?Number(value):value;
  }
  for(const name of ['image_url','avatar_url'])if(payload[name]&&!imageURL(payload[name]))throw new Error('Las imágenes deben usar una URL HTTPS válida.');
  payload.sort_order=Number(values.get('sort_order'));payload.published=values.has('published');
  if(table==='experiences')payload.illustrative=values.has('illustrative');
  const file=values.get('image_file');let uploadedPath;
  try{
   if(file?.size){
    const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    if(!extensions[file.type]||file.size>5*1024*1024)throw new Error('Usá una imagen JPEG, PNG o WebP de hasta 5 MB.');
    uploadedPath=`${table}/${crypto.randomUUID()}.${extensions[file.type]}`;
    const {error}=await db.storage.from('content-images').upload(uploadedPath,file,{contentType:file.type,upsert:false});if(error)throw error;
    payload.image_url=db.storage.from('content-images').getPublicUrl(uploadedPath).data.publicUrl;
   }
   const query=editing?db.from(table).update(payload).eq('id',editing):db.from(table).insert(payload);
   const {error}=await query.select('id').single();if(error)throw error;
  }catch(error){if(uploadedPath)await db.storage.from('content-images').remove([uploadedPath]);throw error;}
  editor();await load();status(payload.published?'Guardado y publicado. Aparecerá al recargar el sitio.':'Borrador guardado.');
 },event.target);});
 try{
  db=await client();
  // Schedule outside the auth callback to avoid Supabase's session lock.
  db.auth.onAuthStateChange((event)=>{
   if(event==='PASSWORD_RECOVERY')recovering=true;
   if(['SIGNED_OUT','PASSWORD_RECOVERY','TOKEN_REFRESHED'].includes(event))setTimeout(()=>checkAccess().catch(e=>status(e.message,true)),0);
  });
  await checkAccess();
 }catch(error){status(error.message,true);}
})();
