import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const alt = "Shee Salamata & Don Vincent — Gusaba Wedding, 17 December 2026, Kigali Serena Hotel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  const [script, serif] = await Promise.all([
    readFile(join(process.cwd(), "node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff")),
    readFile(join(process.cwd(), "node_modules/@fontsource/cinzel/files/cinzel-latin-400-normal.woff")),
  ]);
  return new ImageResponse(<div style={{width:'100%',height:'100%',background:'#F8F4EC',display:'flex',padding:32,color:'#574737',fontFamily:'Royal Serif'}}><div style={{border:'1px solid #C4A46A',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}><div style={{fontSize:42,color:'#a88a56',marginBottom:30}}>S & D</div><div style={{fontSize:15,letterSpacing:5}}>TOGETHER WITH OUR FAMILIES</div><div style={{fontSize:93,marginTop:30,fontFamily:'Royal Script'}}>Shee Salamata & Don Vincent</div><div style={{fontSize:20,marginTop:20,letterSpacing:3}}>OUR GUSABA WEDDING</div><div style={{fontSize:20,marginTop:38}}>17 DECEMBER 2026 · KIGALI SERENA HOTEL</div></div></div>,{ ...size, fonts: [
    { name: "Royal Script", data: new Uint8Array(script).buffer, weight: 400 },
    { name: "Royal Serif", data: new Uint8Array(serif).buffer, weight: 400 },
  ] });
}
