// ZIP store format: no runtime dependencies, UTF-8 filenames, CRC-32 checked by readers.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const table = Array.from({length:256}, (_, n) => { for(let k=0;k<8;k++) n = n&1 ? 0xedb88320^(n>>>1) : n>>>1; return n>>>0; });
export function crc32(data) { let c=0xffffffff; for(const b of data) c=table[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; }
export async function zipDirectory(dir,{exclude=[]}={}) {
  const files=[]; async function walk(root, prefix='') { for(const entry of await readdir(root,{withFileTypes:true})) { if(exclude.includes(entry.name))continue;if(entry.isDirectory()){files.push([prefix+entry.name+'/',Buffer.alloc(0)]);await walk(join(root,entry.name),prefix+entry.name+'/');} else if(entry.isFile()) files.push([prefix+entry.name,await readFile(join(root,entry.name))]); } } await walk(dir);
  const local=[], central=[]; let offset=0, centralSize=0;
  for(const [filename,data] of files) { const name=Buffer.from(filename); const crc=crc32(data); const head=Buffer.alloc(30); head.writeUInt32LE(0x04034b50); head.writeUInt16LE(20,4); head.writeUInt16LE(0x800,6); head.writeUInt16LE(0x21,12); head.writeUInt32LE(crc,14); head.writeUInt32LE(data.length,18); head.writeUInt32LE(data.length,22); head.writeUInt16LE(name.length,26); local.push(head,name,data);
    const c=Buffer.alloc(46); c.writeUInt32LE(0x02014b50); c.writeUInt16LE(20,4); c.writeUInt16LE(20,6); c.writeUInt16LE(0x800,8); c.writeUInt16LE(0x21,14); c.writeUInt32LE(crc,16); c.writeUInt32LE(data.length,20); c.writeUInt32LE(data.length,24); c.writeUInt16LE(name.length,28); c.writeUInt32LE(offset,42); central.push(c,name); centralSize+=c.length+name.length; offset+=head.length+name.length+data.length;
  }
  const end=Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10); end.writeUInt32LE(centralSize,12); end.writeUInt32LE(offset,16); return Buffer.concat([...local,...central,end]);
}
