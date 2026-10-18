import * as THREE from 'three';
const host = document.querySelector('#truck-scene');
const motionButton = document.querySelector('#motion-toggle');
const chapters = [...document.querySelectorAll('.chapter')];
const links = [...document.querySelectorAll('.chapter-track a')];
const label = document.querySelector('#truck-type');
const labels = ['CAPTURE / CONNECTED INTAKE', 'REVIEW / RECRUITER WORKSPACE', 'VALIDATE / VERIFIED FOLLOW-UP'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches, active = 0;
function updateButton() {
 motionButton.setAttribute('aria-pressed', String(paused));
 motionButton.innerHTML = paused ? 'Resume motion <span>▶</span>' : 'Pause motion <span>Ⅱ</span>';
 document.documentElement.style.scrollBehavior = paused ? 'auto' : '';
}
motionButton.addEventListener('click', () => { paused = !paused; updateButton(); });
reduced.addEventListener('change', () => {paused = reduced.matches; updateButton();});
updateButton();
function chapterPosition() {
 const reference = innerWidth <= 650 ? innerHeight * .78 : innerHeight * .56;
 let nearest = 0, distance = Infinity;
 chapters.forEach((chapter,i) => {const r=chapter.getBoundingClientRect();const d=Math.abs(r.top+r.height/2-reference);if(d<distance){distance=d;nearest=i;}});
 if(nearest!==active){active=nearest;links.forEach((link,i)=>{link.classList.toggle('active',i===active);if(i===active)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});label.textContent=labels[active];host.setAttribute('aria-label',`Illustrative TalentIQ journey visual showing ${['Capture','Review','Validate'][active]}.`);}
 const rect=chapters[active].getBoundingClientRect();
 return Math.max(-1,Math.min(1,(reference-rect.top-rect.height/2)/rect.height));
}
addEventListener('scroll', chapterPosition, {passive:true});
chapterPosition();
try {
 const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setClearColor(0xf3f3ef,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 host.append(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(33,1,.1,130);
 const ambient=new THREE.HemisphereLight(0xffffff,0x747469,1.8);scene.add(ambient);
 const light=new THREE.DirectionalLight(0xffffff,2.3);light.position.set(-5,12,9);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-14,right:14,top:12,bottom:-12});light.shadow.bias=-.0004;scene.add(light);
 const fill=new THREE.DirectionalLight(0xffffff,1.4);fill.position.set(8,4,-7);scene.add(fill);
 const mat=(color,roughness=.6,metalness=.1)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const white=mat(0xf8f8f5),black=mat(0x17191a,.7),yellow=mat(0x47c4ae),metal=mat(0x9a9e9f,.3,.85),glass=mat(0x2b4551,.18,.65),rubber=mat(0x161719,.9);
 function box(group,w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 const road=new THREE.Group();scene.add(road);
 box(road,34,.12,6,0,-.1,0,mat(0xe4e4dd,.95,0));
 for(let x=-17;x<18;x+=3)box(road,1.6,.014,.075,x,-.028,2.3,yellow);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.17}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.17;shadow.receiveShadow=true;scene.add(shadow);
 const wheels=[];
 function wheel(group,x,z){const tire=new THREE.Mesh(new THREE.CylinderGeometry(.53,.53,.34,24),rubber);tire.rotation.x=Math.PI/2;tire.position.set(x,.53,z);tire.castShadow=true;group.add(tire);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.36,20),metal);hub.rotation.x=Math.PI/2;hub.position.copy(tire.position);group.add(hub);wheels.push(tire);for(let j=0;j<6;j++){let a=j*Math.PI/3;const bolt=new THREE.Mesh(new THREE.SphereGeometry(.038,6,4),black);bolt.position.set(x+Math.sin(a)*.19,.53+Math.cos(a)*.19,z+(z>0?.19:-.19));group.add(bolt);}}
 function cab(group,short){
  const front=short?-4.1:-5.2;
  box(group,short?2.1:2.2,1.65,2.18,front,1.7,0,white);
  box(group,1.65,.85,2.05,front-.15,2.65,0,white);
  if(!short){box(group,1.25,2.7,2.2,front+1.25,2.25,0,white);box(group,2,.45,2.12,front+.1,3.3,0,white);}
  box(group,1.6,.5,1.98,front-.72,1.65,0,white);
  box(group,.025,.73,1.57,front-1.11,2.67,0,glass);
  for(const z of [-1,1]){
   box(group,.88,.72,.026,front+.03,2.67,z*1.104,glass);
   box(group,.95,.58,.03,front+.04,1.97,z*1.104,white);
   box(group,.48,.20,.035,front+.05,1.96,z*1.125,yellow);
   box(group,.26,.045,.05,front+.29,2.18,z*1.13,black);
   box(group,.14,.45,.17,front-.53,2.52,z*1.3,black);
   box(group,.7,.14,.34,front+.3,.87,z*1.12,metal);
   box(group,1.03,.4,.36,front+1.36,.85,z*.88,metal);
  }
  box(group,.1,.65,1.15,front-1.17,1.4,0,black);
  for(let y=1.17;y<1.73;y+=.1)box(group,.115,.025,1.13,front-1.19,y,0,metal);
  box(group,.17,.23,.36,front-1.18,1.54,.79,mat(0xfaf0bf));box(group,.17,.23,.36,front-1.18,1.54,-.79,mat(0xfaf0bf));
  box(group,.22,.25,2.25,front-1.19,.98,0,metal);
  for(let x=front-.5;x<=front+.51;x+=.25)box(group,.06,.06,.07,x,3.12,1.03,yellow);
  wheel(group,front-.22,-1.08);wheel(group,front-.22,1.08);
 }
 const textureCanvases=[];
 function trailerTexture(index){const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=640;textureCanvases.push(canvas);const ctx=canvas.getContext('2d');ctx.fillStyle=index===1?'#47c4ae':'#f8f8f3';ctx.fillRect(0,0,2048,640);ctx.fillStyle='#d1d1c9';if(index===0){for(let x=0;x<2048;x+=35){ctx.fillRect(x,0,3,640);}}const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
 const textures=[0,1,2].map(trailerTexture);
 function paintTrailers(){textureCanvases.forEach((canvas,index)=>{const ctx=canvas.getContext('2d');ctx.fillStyle=index===1?'#dff5f0':'#f8f8f3';ctx.fillRect(0,0,2048,640);if(index===0){ctx.fillStyle='#dce9e6';for(let x=0;x<2048;x+=35)ctx.fillRect(x,0,2,640);}ctx.fillStyle='#112b35';ctx.font='700 92px Arial';ctx.fillText('TALENT IQ',115,225);ctx.font='700 45px Arial';ctx.fillText(['CANDIDATE INTAKE','RECRUITER WORKSPACE','VERIFIED FOLLOW-UP'][index],118,305);ctx.fillRect(720,90,3,440);ctx.font='700 135px Arial';ctx.fillText(['Capture.','Review.','Validate.'][index],810,260);ctx.font='44px Arial';ctx.fillText(['One scan. One shared record.','One connected workspace.','AI drafts. People decide.'][index],815,348);textures[index].needsUpdate=true;});}
 paintTrailers();
 function truck(index){const g=new THREE.Group();const short=index===2;const length=short?6.2:9.2;const cx=short?.4:1.2;const centerY=short?2.65:2.9;const height=short?2.7:3.05;box(g,short?10:14,.28,1.4,short?-1:-.4,.9,0,black);cab(g,short);box(g,length,height,2.48,cx,centerY,0,index===1?yellow:white);box(g,length,.16,2.55,cx,centerY+height/2,0,metal);box(g,length,.13,2.55,cx,centerY-height/2,0,metal);
  for(const z of [-1,1]){const plane=new THREE.Mesh(new THREE.PlaneGeometry(length-.12,height-.13),new THREE.MeshStandardMaterial({map:textures[index],roughness:.75}));plane.position.set(cx,centerY,z*1.249);if(z===-1)plane.rotation.y=Math.PI;g.add(plane);box(g,length,.04,.02,cx,centerY-height/2+.14,z*1.265,yellow);}
  box(g,.08,height,2.42,cx+length/2+.03,centerY,0,metal);box(g,.14,.14,2.5,cx+length/2,.72,0,metal);
  const axle=short?[2.25]:[-2.65,-1.5,4.05,5.2];for(const x of axle)for(const z of [-1.15,1.15])wheel(g,x,z);
  for(const z of [-1,1]){box(g,short?1.8:2,.3,.15,cx+length/2-.8,.5,z*1.27,black);box(g,.1,.14,.26,cx+length/2+.11,1.13,z,mat(0xbc2827));}
  scene.add(g);g.visible=index===0;return g;
 }
 const trucks=[0,1,2].map(truck);
 let displayed=0,changeTime=0,last=performance.now(),phase=0;
 function resize(){const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.zoom=1.18;camera.position.set(-11,7.5,18);const dist=camera.aspect<1.25?26:22;camera.position.multiplyScalar(dist/22);camera.lookAt(0,1.6,0);camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(host);resize();
 let visible=true;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'150px'}).observe(document.querySelector('.journey'));
 function render(now){requestAnimationFrame(render);const dt=Math.min((now-last)/1000,.05);last=now;if(!visible||document.hidden)return;const progress=chapterPosition();if(displayed!==active){displayed=active;changeTime=now;trucks.forEach((g,i)=>g.visible=i===displayed);}
 const g=trucks[displayed];if(!paused){phase+=dt;const entrance=Math.max(0,1-(now-changeTime)/750);g.position.x=entrance*3.5+progress*.7;g.rotation.y=-.12+progress*.26;g.position.y=Math.sin(phase*1.5)*.018;wheels.forEach(w=>{w.rotation.y-=dt*.9;});road.position.x=-(phase*.8)%3;}
 else{g.position.set(0,0,0);g.rotation.y=-.12;road.position.x=0;}
 renderer.render(scene,camera);
 window.__talentIQScene={ready:true,chapter:active,paused,truckCount:trucks.length,canvasWidth:renderer.domElement.width};}
 requestAnimationFrame(render);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();host.hidden=true;document.querySelector('#fallback').hidden=false;});
} catch(error) {host.hidden=true;document.querySelector('#fallback').hidden=false;motionButton.hidden=true;console.warn('3D is unavailable; the readable presentation is retained.',error);}
