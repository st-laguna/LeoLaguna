import { openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';
const sizes = new Map<string, {width:number; height:number}>();
// Build-time WebP header metadata reserves layout without downloading images.
export function projectImageSize(src:string) {
  const cached=sizes.get(src);if(cached)return cached;
  const file=openSync(join(process.cwd(),'public',src),'r');
  const header=Buffer.alloc(30);
  try { readSync(file,header,0,30,0); } finally { closeSync(file); }
  const format=header.toString('ascii',12,16);
  let width=640,height=512;
  if(format==='VP8X'){width=header.readUIntLE(24,3)+1;height=header.readUIntLE(27,3)+1;}
  else if(format==='VP8L'){const bits=header.readUInt32LE(21);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
  else if(format==='VP8 '){width=header.readUInt16LE(26)&0x3fff;height=header.readUInt16LE(28)&0x3fff;}
  const size={width,height};sizes.set(src,size);return size;
}
