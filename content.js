'use strict';
window.Glunova = (() => {
 const config = window.GLUNOVA_CONFIG || {};
 const configured = Boolean(config.SUPABASE_URL && config.SUPABASE_PUBLISHABLE_KEY && config.SITE_URL);
 const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const imageURL = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
 let promise;
 function client() {
  if (!configured) return Promise.reject(new Error('Completá las tres variables de config.js para conectar Supabase.'));
  if (!promise) promise = new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.90.1/dist/umd/supabase.js';
   script.onload = () => { try { resolve(window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY)); } catch(e) { reject(e); } };
   script.onerror = () => reject(new Error('No se pudo cargar Supabase. Revisá tu conexión y recargá la página.'));
   document.head.append(script);
  });
  return promise;
 }
 const adminURL = () => new URL('admin.html', config.SITE_URL.replace(/\/?$/, '/')).href;
 return {config, configured, escape, imageURL, client, adminURL};
})();
