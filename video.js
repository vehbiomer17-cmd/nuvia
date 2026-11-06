'use strict';
(() => {
 const trigger=document.querySelector('[data-video]');
 const dialog=document.querySelector('#video-modal');
 if(!trigger||!dialog||typeof dialog.showModal!=='function')return;
 const video=dialog.querySelector('video');
 trigger.addEventListener('click',event=>{
  event.preventDefault();
  dialog.showModal();
  const playback=video.play();
  if(playback)playback.catch(()=>{}); // Native controls remain available if playback is blocked.
 });
 dialog.querySelector('.video-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const bounds=dialog.getBoundingClientRect();
  if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
 });
 dialog.addEventListener('close',()=>{
  video.pause();
  video.currentTime=0;
  trigger.focus();
 });
})();
