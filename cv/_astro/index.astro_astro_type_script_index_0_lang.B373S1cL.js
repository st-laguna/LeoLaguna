const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/smoothScroll.C30h7HQd.js","_astro/index.xgxdCp6f.js","_astro/ScrollTrigger.ak1EnQU5.js"])))=>i.map(i=>d[i]);
import{g as L}from"./index.xgxdCp6f.js";import{S as V}from"./ScrollTrigger.ak1EnQU5.js";const J=(function(){const t=typeof document<"u"&&document.createElement("link").relList;return t&&t.supports&&t.supports("modulepreload")?"modulepreload":"preload"})(),ee=function(n){return"/"+n},K={},te=function(t,g,A){let a=Promise.resolve();if(g&&g.length>0){let b=function(v){return Promise.all(v.map(p=>Promise.resolve(p).then(w=>({status:"fulfilled",value:w}),w=>({status:"rejected",reason:w}))))};document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),d=c?.nonce||c?.getAttribute("nonce");a=b(g.map(v=>{if(v=ee(v),v in K)return;K[v]=!0;const p=v.endsWith(".css"),w=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${v}"]${w}`))return;const l=document.createElement("link");if(l.rel=p?"stylesheet":J,p||(l.as="script"),l.crossOrigin="",l.href=v,d&&l.setAttribute("nonce",d),document.head.appendChild(l),p)return new Promise((I,M)=>{l.addEventListener("load",I),l.addEventListener("error",()=>M(new Error(`Unable to preload CSS for ${v}`)))})}))}function y(c){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=c,window.dispatchEvent(d),!d.defaultPrevented)throw c}return a.then(c=>{for(const d of c||[])d.status==="rejected"&&y(d.reason);return t().catch(y)})};function ne(){const n=document.getElementById("water-shader");if(!n)return()=>{};const t=n.getContext("webgl");if(!t)return()=>{};let g=0,A=!1;const a={x:0,y:0},y=()=>{n.width=n.offsetWidth,n.height=n.offsetHeight,t.viewport(0,0,n.width,n.height)},c=o=>{const r=n.getBoundingClientRect();a.x=o.clientX-r.left,a.y=n.height-(o.clientY-r.top)};y(),window.addEventListener("resize",y),window.addEventListener("mousemove",c);const d=`
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `,b=`
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;

        vec3 color1 = vec3(0.463, 0.729, 0.655);
        vec3 color2 = vec3(0.396, 0.624, 0.565);
        vec3 color3 = vec3(0.067, 0.071, 0.078);
        vec3 color4 = vec3(0.067, 0.071, 0.078);

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                u.y
            );
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p = p * 1.5 + vec2(1.7, 9.2);
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            uv.y = pow(uv.y, 1.8);
            uv.x = (uv.x - 0.5) * (1.0 + (1.0 - uv.y) * 1.5) + 0.5;

            vec2 p = uv * 1.2;
            float t = u_time * 0.2;

            vec2 mouseUV = u_mouse / u_resolution;
            float mouseDist = length(uv - mouseUV);
            float mouseWave = smoothstep(0.3, 0.0, mouseDist) * 0.3;

            float n1 = fbm(p * 0.8 + vec2(t * 0.2 - p.x * 0.2, t * 0.25));
            float n2 = fbm(p * 0.8 + vec2(-t * 0.2 - p.x * 0.1, t * 0.3) + n1 * 0.4);
            float n3 = fbm((p + vec2(-t * 0.4, 0.0)) * 1.0 + n2 * 0.5 + mouseWave);

            float blend1 = smoothstep(0.35, 0.45, n3);
            float blend2 = smoothstep(0.45, 0.55, n3);
            float blend3 = smoothstep(0.55, 0.65, n3);

            vec3 col = mix(color4, color1, blend1);
            col = mix(col, color3, blend2);
            col = mix(col, color2, blend3);

            col = mix(color4, col, smoothstep(0.0, 0.3, uv.y));

            float grain = hash(uv * (u_resolution * 0.3) + u_time * 50.0) * 0.04;
            col += grain - 0.02;

            float dotSize = 7.0;
            vec2 dotUV = fract(gl_FragCoord.xy / dotSize) - 0.5;
            float brightness = dot(col, vec3(0.299, 0.587, 0.114));
            float midRange = smoothstep(0.0, 0.2, brightness) * (1.0 - smoothstep(0.5, 0.7, brightness));
            float radius = 0.4 * midRange;
            float dot_ = smoothstep(radius, radius - 0.1, length(dotUV));
            vec3 darkColor = vec3(0.067, 0.071, 0.078);

            col = mix(col, darkColor, dot_ * midRange * 0.5);
            gl_FragColor = vec4(col, 1.0);
        }
    `,v=(o,r)=>{const s=t.createShader(o);return s?(t.shaderSource(s,r),t.compileShader(s),t.getShaderParameter(s,t.COMPILE_STATUS)?s:(console.error(t.getShaderInfoLog(s)),t.deleteShader(s),null)):null},p=v(t.VERTEX_SHADER,d),w=v(t.FRAGMENT_SHADER,b);if(!p||!w)return()=>{window.removeEventListener("resize",y),window.removeEventListener("mousemove",c)};const l=t.createProgram();if(!l)return()=>{window.removeEventListener("resize",y),window.removeEventListener("mousemove",c)};if(t.attachShader(l,p),t.attachShader(l,w),t.linkProgram(l),!t.getProgramParameter(l,t.LINK_STATUS))return console.error(t.getProgramInfoLog(l)),()=>{window.removeEventListener("resize",y),window.removeEventListener("mousemove",c),t.deleteShader(p),t.deleteShader(w),t.deleteProgram(l)};t.useProgram(l);const I=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,I),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),t.STATIC_DRAW);const M=t.getAttribLocation(l,"a_position");t.enableVertexAttribArray(M),t.vertexAttribPointer(M,2,t.FLOAT,!1,0,0);const F=t.getUniformLocation(l,"u_resolution"),W=t.getUniformLocation(l,"u_time"),O=t.getUniformLocation(l,"u_mouse"),k=performance.now(),C=()=>{if(A)return;const o=(performance.now()-k)/1e3;t.uniform2f(F,n.width,n.height),t.uniform1f(W,o),t.uniform2f(O,a.x,a.y),t.drawArrays(t.TRIANGLES,0,6),g=requestAnimationFrame(C)};return C(),()=>{A=!0,cancelAnimationFrame(g),window.removeEventListener("resize",y),window.removeEventListener("mousemove",c),t.deleteBuffer(I),t.deleteShader(p),t.deleteShader(w),t.deleteProgram(l)}}L.registerPlugin(V);const oe=()=>{V.getAll().forEach(n=>n.kill()),L.killTweensOf(".process-stages-contain"),L.killTweensOf(".process-stages-overlay"),L.killTweensOf(".layer")};function re(){document.querySelectorAll(".layer").forEach(n=>{const t=Number(n.dataset.speed);L.to(n,{y:()=>-(window.innerHeight*t),ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:!0}})})}const X={density:14e-5,swimmerRatio:.13,maxParticles:190,minParticles:42,retinaLimit:1.75},h=(n,t)=>Math.random()*(t-n)+n,se=(n,t,g)=>Math.max(t,Math.min(g,n));function ie(n){const t=n.querySelector("canvas");if(!t)return()=>{};const g=t.getContext("2d",{alpha:!0});if(!g)return()=>{};const A=t,a=g,y={...X,density:Number(n.dataset.density)||X.density,swimmerRatio:Number(n.dataset.swimmerRatio)||X.swimmerRatio},c=[];let d=0,b=0,v=0,p=!0,w=!0,l=-9999,I=-9999;const M=window.matchMedia("(prefers-reduced-motion: reduce)");function F(){const e=d*b,m=d<720?.62:1;return Math.round(se(e*y.density*m,y.minParticles,y.maxParticles))}function W(){return Math.random()<y.swimmerRatio?"swimmer":Math.random()<.34?"wanderer":"drifter"}function O(){const e=W(),m=h(0,Math.PI*2),f=e==="swimmer"?h(.34,.82):e==="wanderer"?h(.08,.25):h(.025,.12);return{x:h(0,d),y:h(0,b),vx:Math.cos(m)*f,vy:Math.sin(m)*f,size:e==="swimmer"?h(1.3,2.8):h(.55,1.9),opacity:e==="swimmer"?h(.46,.82):h(.16,.48),pulse:h(0,Math.PI*2),pulseSpeed:h(.012,.034),kind:e,directionTimer:h(90,260),hue:e==="swimmer"?h(164,188):h(188,214)}}function k(){const e=Math.min(window.devicePixelRatio||1,y.retinaLimit);d=Math.max(1,A.offsetWidth),b=Math.max(1,A.offsetHeight),A.width=Math.floor(d*e),A.height=Math.floor(b*e),a.setTransform(e,0,0,e,0,0);const m=F();for(;c.length<m;)c.push(O());for(;c.length>m;)c.pop()}function C(e){e.x<-24&&(e.x=d+24),e.x>d+24&&(e.x=-24),e.y<-24&&(e.y=b+24),e.y>b+24&&(e.y=-24)}function o(e,m){const f=Math.sin(m*45e-5+e.y*.018)*.16,q=Math.cos(m*38e-5+e.x*.014)*.11;if(e.kind==="swimmer"&&(e.directionTimer-=1,e.directionTimer<=0)){const x=h(0,Math.PI*2),T=h(.34,.82);e.vx=e.vx*.68+Math.cos(x)*T*.32,e.vy=e.vy*.68+Math.sin(x)*T*.32,e.directionTimer=h(110,290)}e.kind==="wanderer"&&(e.vx+=h(-.014,.014),e.vy+=h(-.014,.014),e.vx*=.975,e.vy*=.975),e.kind==="drifter"&&(e.vx*=.992,e.vy*=.992);const P=e.x-l,B=e.y-I,z=P*P+B*B,U=110,R=U*U;if(z<R){const x=(1-z/R)*.018;e.vx+=P*x,e.vy+=B*x}e.x+=e.vx+f,e.y+=e.vy+q,e.pulse+=e.pulseSpeed,C(e)}function r(e){const m=Math.sin(e.pulse)*.18+.82,f=e.opacity*m;a.globalAlpha=f,a.fillStyle=`hsl(${e.hue} 88% 78%)`,a.beginPath(),a.arc(e.x,e.y,e.size,0,Math.PI*2),a.fill(),a.globalAlpha=f*.22,a.beginPath(),a.arc(e.x,e.y,e.size*3.6,0,Math.PI*2),a.fill(),e.kind==="swimmer"&&(a.globalAlpha=f*.28,a.strokeStyle=`hsl(${e.hue} 88% 78%)`,a.lineWidth=1,a.beginPath(),a.moveTo(e.x,e.y),a.lineTo(e.x-e.vx*9,e.y-e.vy*9),a.stroke()),a.globalAlpha=1}function s(e=0){if(p){if(w&&!M.matches){a.clearRect(0,0,d,b);for(const m of c)o(m,e),r(m)}v=window.requestAnimationFrame(s)}}function i(e){const m=A.getBoundingClientRect();l=e.clientX-m.left,I=e.clientY-m.top}function u(){l=-9999,I=-9999}function E(){p=!1,window.cancelAnimationFrame(v),S.disconnect(),_.disconnect(),n.removeEventListener("pointermove",i),n.removeEventListener("pointerleave",u),document.removeEventListener("astro:before-swap",E)}const S=new ResizeObserver(k),_=new IntersectionObserver(([e])=>{w=!!e?.isIntersecting},{threshold:.05});return S.observe(n),_.observe(n),n.addEventListener("pointermove",i),n.addEventListener("pointerleave",u),document.addEventListener("astro:before-swap",E),k(),s(),E}L.registerPlugin(V);function ae(){L.utils.toArray(".text").forEach(t=>{L.to(t,{backgroundSize:"100%",ease:"none",scrollTrigger:{trigger:t,start:"top 80%",end:"top 80%",scrub:!0}})})}let Z=null,j=null,G=null,H=null,D=null,Y=null,$=null;const N=new Set;function Q(){H?.abort(),H=null,D&&clearInterval(D),Y&&clearInterval(Y),$&&clearInterval($),D=null,Y=null,$=null,N.forEach(n=>clearInterval(n)),N.clear(),j?.(),G?.(),j=null,G=null}document.addEventListener("astro:page-load",async()=>{Q(),H=new AbortController;const{signal:n}=H;if(!Z){const{initSmoothScroll:o}=await te(async()=>{const{initSmoothScroll:r}=await import("./smoothScroll.C30h7HQd.js");return{initSmoothScroll:r}},__vite__mapDeps([0,1,2]));Z=o()}oe(),re(),ae(),V.refresh();const t=document.getElementById("plankton-section");t&&(j=ie(t));const g=L.utils.toArray(".program");if(g.length){L.set(g,{opacity:0,filter:"blur(8px)"}),L.set(g[0],{opacity:1,filter:"blur(0px)"});let o=0;D=setInterval(()=>{const r=(o+1)%g.length;L.to(g[o],{opacity:0,filter:"blur(8px)",duration:.5,ease:"power2.out"}),L.to(g[r],{opacity:1,filter:"blur(0px)",duration:.5,ease:"power2.out"}),o=r},2500)}const A=document.getElementById("about-panel"),a=document.getElementById("panel-overlay"),y=document.getElementById("close-panel");if(A&&a&&y){const o=()=>{A.classList.add("translate-x-full"),a.classList.add("opacity-0","pointer-events-none")};document.querySelectorAll('a[href="/#about"]').forEach(r=>{r.addEventListener("click",s=>{s.preventDefault(),A.classList.remove("translate-x-full"),a.classList.remove("opacity-0","pointer-events-none")},{signal:n})}),y.addEventListener("click",o,{signal:n}),a.addEventListener("click",o,{signal:n})}const c=document.getElementById("cursor-label"),d=document.querySelectorAll("[data-tool]");c&&(document.addEventListener("mousemove",o=>{c.style.left=`${o.clientX+14}px`,c.style.top=`${o.clientY-10}px`},{signal:n}),d.forEach(o=>{o.addEventListener("mouseenter",()=>{c.textContent=o.dataset.tool||"",c.classList.remove("opacity-0")},{signal:n}),o.addEventListener("mouseleave",()=>{c.classList.add("opacity-0")},{signal:n})}));const b=[{file:"BL.svg",name:"Birdlife International"},{file:"COA3.svg",name:"Coalicion Tiburon"},{file:"EXO3.svg",name:"Exo Environmental"},{file:"GROA3.svg",name:"Gro Aqua"},{file:"HAVIDA3.svg",name:"Havida"},{file:"IMA3.svg",name:"IMARPE"},{file:"ISRA3.svg",name:"Important Sharks and Ray Areas"},{file:"KA.svg",name:"Kystarbeid AS"},{file:"QW3.svg",name:"SUNY Old Westbury"},{file:"SOA3.svg",name:"Sustainable Ocean Alliance"},{file:"SPERMWHALES3.svg",name:"Sperm Whales Dominica"},{file:"STRA3.svg",name:"Strategik"},{file:"VH.svg",name:"Valhalla Orca Expedition"},{file:"WEWHALE3.svg",name:"WeWhale"},{file:"WWF3.svg",name:"World Wildlife Fund"}],v=document.querySelectorAll(".brand-cell");let p=0;const w=(o,r)=>{const s=o.querySelector(".brand-img"),i=o.querySelector(".brand-flipper");!s||!i||(i.style.transition="transform 0.3s ease-in",i.style.transform="rotateX(90deg)",window.setTimeout(()=>{if(n.aborted)return;const u=`/images/brands/${r.file}`;s.src.endsWith(u)||(s.src=u),i.style.transition="transform 0.3s ease-out",i.style.transform="rotateX(0deg)"},300))};v.forEach((o,r)=>{const s=o.querySelector(".brand-img");s&&b[r]&&(s.src=`/images/brands/${b[r].file}`)}),p=5,v.length&&(Y=setInterval(()=>{v.forEach((o,r)=>{window.setTimeout(()=>{n.aborted||(w(o,b[p%b.length]),p++)},r*120)})},5e3)),G=ne();const l=document.getElementById("clock-time"),I=document.getElementById("clock-date");if(l&&I){const o=()=>{const r=new Date;l.textContent=`Lima ${r.toLocaleTimeString("en-US",{timeZone:"America/Lima"})}`,I.textContent=r.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"short",day:"numeric",timeZone:"America/Lima"})};o(),$=setInterval(o,1e3)}document.querySelectorAll(".project-row").forEach(o=>{const r=o.querySelectorAll(".project-img");if(r.length<=1)return;const s=o.querySelector(".project-img-container");if(!s)return;const i=Array.from(r).slice(1);let u=-1,E=null,S=!1;const _=()=>{E&&(clearInterval(E),N.delete(E),E=null)};i.forEach(f=>{f.style.transition="none",f.style.transform="translateY(110%)"});function e(f,q){u>=0&&u!==f&&(i[u].style.transition=q?"transform 0.45s cubic-bezier(0.4,0,0.2,1)":"none",i[u].style.transform="translateY(110%)"),i[f].style.transition=q?"transform 0.45s cubic-bezier(0.4,0,0.2,1)":"none",i[f].style.transform="translateY(0%)",u=f}function m(){_(),E=setInterval(()=>{!S||n.aborted||e((u+1)%i.length,!1)},1500),N.add(E)}s.addEventListener("mouseenter",()=>{S=!0,r[0].style.transition="filter 0.4s ease",r[0].style.filter="brightness(0.35)",e(0,!0),window.setTimeout(()=>{S&&!n.aborted&&m()},500)},{signal:n}),s.addEventListener("mouseleave",()=>{S=!1,_(),u>=0&&(i[u].style.transition="transform 0.45s cubic-bezier(0.4,0,0.2,1)",i[u].style.transform="translateY(110%)"),i.forEach((f,q)=>{q!==u&&(f.style.transition="none",f.style.transform="translateY(110%)")}),u=-1,r[0].style.transition="filter 0.5s ease",r[0].style.filter="brightness(1)"},{signal:n})});const M="▖▗▘◢◣◤◥▲▶▼◀▴▸▾◂◭◮◬◫◸◹◺◿⯅⯆⯇⯈ ▝▚▞▙▛▜▟◢◣◤◥▀▄▌▐▏▎█▁▂▃▄▅",F=150,W=1.15;function O(o){const r=o.textContent??"",s=r.length;let i=null,u=null,E=null,S=[];const _=()=>M[Math.floor(Math.random()*M.length)];function e(){i&&cancelAnimationFrame(i),i=null,u=null}n.addEventListener("abort",e,{once:!0});function m(P){if(n.aborted)return;u||(u=P);const B=P-u,z=Math.min(B/(F*W),1),U=Math.floor(z*s);let R="";if(E==="in")for(let x=0;x<s;x++)r[x]===" "?R+=" ":x<U?R+=r[x]:R+=S[x];else{const x=s-U;for(let T=0;T<s;T++)r[T]===" "?R+=" ":T>=x?R+=r[T]:R+=S[T]}o.textContent=R,z<1?i=requestAnimationFrame(m):(o.textContent=r,o.classList.remove("is-scrambling"),i=null)}function f(){e(),E="in",o.classList.add("is-scrambling"),S=Array.from(r).map(P=>P===" "?" ":_()),o.textContent=S.join(""),i=requestAnimationFrame(m)}function q(){e(),E="out",o.classList.add("is-scrambling"),S=Array.from(r).map(P=>P===" "?" ":_()),o.textContent=S.join(""),i=requestAnimationFrame(m)}return{play:f,cancel:q}}document.querySelectorAll(".nav-item span:first-child").forEach(o=>{const r=O(o),s=o.closest(".nav-item");s&&(s.addEventListener("mouseenter",()=>r.play(),{signal:n}),s.addEventListener("mouseleave",()=>r.cancel(),{signal:n}))});let k=0,C=0;window.addEventListener("mousemove",o=>{k=o.clientX,C=o.clientY},{signal:n}),document.querySelectorAll(".services-item-media").forEach(o=>{const r=o.querySelector(".services-explore");if(!r)return;const s=()=>{const i=o.getBoundingClientRect();k>=i.left&&k<=i.right&&C>=i.top&&C<=i.bottom&&(r.style.left=`${k-i.left}px`,r.style.top=`${C-i.top}px`)};o.addEventListener("mousemove",s,{signal:n}),window.addEventListener("scroll",s,{passive:!0,signal:n})})});document.addEventListener("astro:before-swap",Q);
