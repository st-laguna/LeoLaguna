// A local edge-only pass. The marquee owns scheduling and supplies its existing geometry.
// WebGL cannot sample the DOM backdrop; no page capture or second animation loop is used.
const vertex = `attribute vec2 position; varying vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision mediump float;
varying vec2 uv;
uniform sampler2D source, blurred;
uniform vec2 blurStep;
uniform float blurPass;
uniform vec2 sourceSize;
uniform float band, padding, scale, side, height;
uniform vec3 background, foreground;
float lens(float t){
 if(t<.2)return mix(.45,.28,t/.2);
 if(t<.45)return mix(.28,.10,(t-.2)/.25);
 if(t<.7)return mix(.10,.02,(t-.45)/.25);
 return mix(.02,0.,clamp((t-.7)/.2,0.,1.));
}
float falloff(float t){
 if(t<.4)return mix(1.,.95,t/.4);
 if(t<.75)return mix(.95,.3,(t-.4)/.35);
 return mix(.3,0.,(t-.75)/.25);
}
float sampleAlpha(vec2 p){return texture2D(source,p/sourceSize).a;}
void main(){
 if(blurPass>.5){
   gl_FragColor=texture2D(source,uv)*.227027;
   gl_FragColor+=(texture2D(source,uv+blurStep*1.384615)+texture2D(source,uv-blurStep*1.384615))*.316216;
   gl_FragColor+=(texture2D(source,uv+blurStep*3.230769)+texture2D(source,uv-blurStep*3.230769))*.070270;
   return;
 }
 float edge=side<.5?uv.x:1.-uv.x;
 vec2 p=vec2(side*(band+2.*padding)+padding+uv.x*band,uv.y*height);
 float original=sampleAlpha(p);
 if(edge>.995){gl_FragColor=vec4(mix(background,foreground,original),1.);return;}
 float shift=lens(edge)*scale*(side<.5?1.:-1.);
 vec3 coverage=vec3(texture2D(blurred,(p+vec2(106.*shift,0.))/sourceSize).a,
   texture2D(blurred,(p+vec2(70.*shift,0.))/sourceSize).a,texture2D(blurred,(p+vec2(54.*shift,0.))/sourceSize).a);
 coverage=mix(vec3(original),coverage,falloff(edge));
 gl_FragColor=vec4(mix(background,foreground,coverage),1.);
}`;

export function createFooterRefraction(host: HTMLElement) {
  const canvas=host.querySelector<HTMLCanvasElement>('[data-footer-refraction-canvas]')!;
  const input=document.createElement('canvas');
  const ctx=input.getContext('2d');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
  if(!ctx||!gl)return null;
  const shaders: WebGLShader[]=[];
  const program=gl.createProgram()!;
  let buffer: WebGLBuffer|null=null, texture: WebGLTexture|null=null;
  const blurTextures:WebGLTexture[]=[], targets:WebGLFramebuffer[]=[];
  function release(){blurTextures.forEach(t=>gl!.deleteTexture(t));targets.forEach(f=>gl!.deleteFramebuffer(f));gl!.deleteTexture(texture);gl!.deleteBuffer(buffer);shaders.forEach(s=>gl!.deleteShader(s));gl!.deleteProgram(program);}
  try{
    for(const [type,code] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const){
      const shader=gl.createShader(type)!;shaders.push(shader);gl.shaderSource(shader,code);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'Glass shader compilation failed');
      gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Glass shader link failed');
    gl.useProgram(program);
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  }catch(error){console.warn('Footer refraction: using lightweight fallback.',error);release();gl.getExtension('WEBGL_lose_context')?.loseContext();return null;}
  const uniforms=Object.fromEntries(['source','blurred','blurPass','blurStep','sourceSize','band','padding','scale','side','height','background','foreground'].map(name=>[name,gl.getUniformLocation(program,name)]));
  const limit=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
  let width=0,height=0,band=0,padding=0,ratio=1,lost=false,blurWidth=0,blurHeight=0,softness=0;
  for(let i=0;i<2;i++){
    const t=gl.createTexture()!,f=gl.createFramebuffer()!;blurTextures.push(t);targets.push(f);
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,texture);
  const events=new AbortController();
  canvas.addEventListener('webglcontextlost',()=>{lost=true;host.removeAttribute('data-glass-gpu');},{signal:events.signal});
  function color(value:string){
    ctx!.fillStyle='#000';ctx!.fillStyle=value;const css=ctx!.fillStyle;
    if(css.startsWith('#')){const hex=css.slice(1);const full=hex.length===3?hex.split('').map(v=>v+v).join(''):hex;return [0,2,4].map(i=>parseInt(full.slice(i,i+2),16)/255);}
    return (css.match(/[\d.]+/g)||['0','0','0']).slice(0,3).map(v=>Number(v)/255);
  }
  function resize(htmlSource:boolean){
    if(lost)return;
    width=host.clientWidth;height=host.clientHeight;
    band=host.querySelector<HTMLElement>('[data-footer-glass]')!.clientWidth;
    if(!width||!height||!band)return;
    const scale=htmlSource?1:height/200;
    softness=3.2*scale/1.689;
    padding=Math.ceil(64*scale);
    const mobile=matchMedia('(any-pointer:coarse)').matches;
    ratio=Math.min(devicePixelRatio||1,mobile?1:1.5,limit/width,limit/height,limit/(2*(band+2*padding)));
    const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
    const iw=Math.ceil(2*(band+2*padding)*ratio);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl!.activeTexture(gl!.TEXTURE0);gl!.bindTexture(gl!.TEXTURE_2D,texture);
    if(input.width!==iw||input.height!==h){
      input.width=iw;input.height=h;
      gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,iw,h,0,gl!.RGBA,gl!.UNSIGNED_BYTE,null);
    }
    // The soft source is intentionally lower resolution; crisp coverage stays separate.
    const blurRatio=Math.min(mobile ? 0.5 : 1,1/(ratio*Math.max(1,softness)));
    const bw=Math.max(1,Math.ceil(iw*blurRatio)),bh=Math.max(1,Math.ceil(h*blurRatio));
    if(bw!==blurWidth||bh!==blurHeight){
      blurWidth=bw;blurHeight=bh;
      for(let i=0;i<2;i++){
        gl!.bindTexture(gl!.TEXTURE_2D,blurTextures[i]);
        gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,bw,bh,0,gl!.RGBA,gl!.UNSIGNED_BYTE,null);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER,targets[i]);
        if(gl!.checkFramebufferStatus(gl!.FRAMEBUFFER)!==gl!.FRAMEBUFFER_COMPLETE){lost=true;host.removeAttribute('data-glass-gpu');}
      }
      gl!.bindFramebuffer(gl!.FRAMEBUFFER,null);gl!.bindTexture(gl!.TEXTURE_2D,texture);
    }
    gl!.uniform1i(uniforms.source,0);gl!.uniform1i(uniforms.blurred,1);
    gl!.uniform2f(uniforms.sourceSize,iw/ratio,h/ratio);
    gl!.uniform1f(uniforms.band,band);gl!.uniform1f(uniforms.padding,padding);
    gl!.uniform1f(uniforms.height,height);gl!.uniform1f(uniforms.scale,scale);
    const style=getComputedStyle(host);
    const bg=color(style.getPropertyValue('--background').trim());const fg=color(style.getPropertyValue('--foreground').trim()||style.color);
    gl!.uniform3f(uniforms.background,bg[0],bg[1],bg[2]);gl!.uniform3f(uniforms.foreground,fg[0],fg[1],fg[2]);
  }
  function render(paint:(ctx:CanvasRenderingContext2D)=>void){
    if(lost||!width||!height||document.hidden)return;
    ctx!.setTransform(1,0,0,1,0,0);ctx!.clearRect(0,0,input.width,input.height);
    for(let side=0;side<2;side++){
      const start=side*(band+2*padding);
      ctx!.save();ctx!.beginPath();ctx!.rect(start*ratio,0,(band+2*padding)*ratio,input.height);ctx!.clip();
      ctx!.setTransform(ratio,0,0,ratio,(start+padding-(side?width-band:0))*ratio,0);
      ctx!.fillStyle='#fff';paint(ctx!);ctx!.restore();
    }
    gl!.activeTexture(gl!.TEXTURE0);gl!.bindTexture(gl!.TEXTURE_2D,texture);
    gl!.texSubImage2D(gl!.TEXTURE_2D,0,0,0,gl!.RGBA,gl!.UNSIGNED_BYTE,input);
    gl!.uniform1f(uniforms.blurPass,1);
    // Unbind the final sampler before either attachment is written (no feedback loop).
    gl!.activeTexture(gl!.TEXTURE1);gl!.bindTexture(gl!.TEXTURE_2D,texture);gl!.activeTexture(gl!.TEXTURE0);
    gl!.viewport(0,0,blurWidth,blurHeight);
    for(let i=0;i<2;i++){
      gl!.bindFramebuffer(gl!.FRAMEBUFFER,targets[i]);gl!.bindTexture(gl!.TEXTURE_2D,i?blurTextures[0]:texture);
      gl!.uniform2f(uniforms.blurStep,i?0:softness/(input.width/ratio),i?softness/(input.height/ratio):0);
      gl!.drawArrays(gl!.TRIANGLE_STRIP,0,4);
    }
    gl!.bindFramebuffer(gl!.FRAMEBUFFER,null);gl!.uniform1f(uniforms.blurPass,0);
    gl!.bindTexture(gl!.TEXTURE_2D,texture);gl!.activeTexture(gl!.TEXTURE1);gl!.bindTexture(gl!.TEXTURE_2D,blurTextures[1]);
    gl!.clearColor(0,0,0,0);gl!.clear(gl!.COLOR_BUFFER_BIT);
    const bw=Math.round(band*ratio);
    for(let side=0;side<2;side++){
      gl!.viewport(side?canvas.width-bw:0,0,bw,canvas.height);gl!.uniform1f(uniforms.side,side);gl!.drawArrays(gl!.TRIANGLE_STRIP,0,4);
    }
    host.setAttribute('data-glass-gpu','');
  }
  return {get available(){return !lost;},resize,render,dispose(){events.abort();host.removeAttribute('data-glass-gpu');release();gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.width=canvas.height=input.width=input.height=1;canvas.replaceWith(canvas.cloneNode(false));}};
}
