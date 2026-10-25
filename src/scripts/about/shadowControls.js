// Adapted from the user's sun-control prototype; scene owns all listeners.
export function mountShadowControls({ section, sun, backgroundShadow, on, requestRender }) {
 const ui=section.querySelector('[data-shadow-controls]');if(!ui)return ()=>{};
 const dial=ui.querySelector('[data-sun-dial]'),handle=ui.querySelector('[data-sun-handle]'),ray=ui.querySelector('[data-sun-ray]'),values=ui.querySelector('[data-sun-values]');
 const original=sun.position.clone(),distant=backgroundShadow.position.clone();
 let azimuth=45,elevation=Math.atan2(original.y,Math.hypot(original.x,original.z))*180/Math.PI,pointer=null,lastPoint=null;

 function draw(){const x=(azimuth/180-1)*125,y=(1-elevation/45)*125;handle.setAttribute('cx',150+x);handle.setAttribute('cy',150+y);ray.setAttribute('x2',150+x);ray.setAttribute('y2',150+y);values.textContent=`${Math.round(azimuth)}° · ${Math.round(elevation)}°`;dial.setAttribute('aria-description',`Azimuth ${Math.round(azimuth)}°, elevation ${Math.round(elevation)}°`);}
 function update(){const a=azimuth*Math.PI/180,h=elevation*Math.PI/180;const x=Math.sin(a)*Math.cos(h),y=Math.sin(h),z=Math.cos(a)*Math.cos(h);sun.position.set(x,y,z).multiplyScalar(original.length());backgroundShadow.position.set(x,y,z).multiplyScalar(distant.length());draw();requestRender();}
 // Relative dragging avoids click-to-jump; reduced gain makes fine tuning easier.
 function point(event){const matrix=dial.getScreenCTM();if(!matrix)return null;const p=dial.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(matrix.inverse());}
 function move(event){if(pointer!==event.pointerId)return;const q=point(event);if(!q)return;if(lastPoint){const gain=.35;azimuth=Math.max(0,Math.min(360,azimuth+(q.x-lastPoint.x)/125*180*gain));elevation=Math.max(10,Math.min(85,elevation-(q.y-lastPoint.y)/125*45*gain));update();}lastPoint=q;}
 on(dial,'pointerdown',event=>{if(event.button!==0||pointer!==null)return;event.preventDefault();pointer=event.pointerId;lastPoint=point(event);dial.setPointerCapture(pointer);dial.focus({preventScroll:true});});on(dial,'pointermove',move);
 const end=event=>{if(pointer===event.pointerId){pointer=null;lastPoint=null;}};on(dial,'pointerup',end);on(dial,'pointercancel',end);on(dial,'lostpointercapture',end);
 on(dial,'keydown',event=>{const step=event.shiftKey?5:1;if(event.key==='ArrowLeft')azimuth=(azimuth-step+360)%360;else if(event.key==='ArrowRight')azimuth=(azimuth+step)%360;else if(event.key==='ArrowUp')elevation=Math.min(85,elevation+step);else if(event.key==='ArrowDown')elevation=Math.max(10,elevation-step);else return;event.preventDefault();update();});
 dial.setAttribute('aria-disabled','false');draw();
 return ()=>{pointer=null,lastPoint=null;dial.setAttribute('aria-disabled','true');};
}