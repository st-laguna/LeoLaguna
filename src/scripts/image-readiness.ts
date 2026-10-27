// One bounded queue shared by Services, galleries and case studies.
type Job={image:HTMLImageElement;priority:number;active:()=>boolean;resolve:(ready:boolean)=>void;promise:Promise<boolean>;started:boolean;settled:boolean};
const jobs=new WeakMap<HTMLImageElement,Job>(),queue:Job[]=[];let running=0;
function pump(){
 queue.sort((a,b)=>a.priority-b.priority);
 while(running<2&&queue.length){const job=queue.shift()!;
  if(!job.active()||!job.image.isConnected){jobs.delete(job.image);job.resolve(false);continue;}
  job.started=true;running++;const image=job.image;
  image.loading='eager';image.fetchPriority=job.priority===0?'high':'auto';
  if(image.dataset.srcset)image.srcset=image.dataset.srcset;
  const source=image.dataset.src||image.dataset.caseSrc;
  if(source&&!image.hasAttribute('src'))image.src=source;
  void image.decode().then(()=>job.resolve(image.naturalWidth>0),()=>{jobs.delete(image);job.resolve(false);}).finally(()=>{job.settled=true;running--;pump();});
 }
}
export function prepareImage(image:HTMLImageElement,priority=1,active:()=>boolean=()=>true){
 let current=jobs.get(image);if(current?.settled&&(!image.complete||!image.naturalWidth)){jobs.delete(image);current=undefined;}if(current){current.priority=Math.min(priority,current.priority);current.active=active;if(priority===0)image.fetchPriority='high';pump();return current.promise;}
 let resolve!:(ready:boolean)=>void;const promise=new Promise<boolean>(done=>resolve=done);
 const job:Job={image,priority,active,resolve,promise,started:false,settled:false};jobs.set(image,job);queue.push(job);pump();return promise;
}
export function prepareImages(root:Element,priority=1,active:()=>boolean=()=>true){return Promise.all(Array.from(root.querySelectorAll<HTMLImageElement>('img[data-src],img[data-case-src]'),image=>prepareImage(image,priority,active)));}
