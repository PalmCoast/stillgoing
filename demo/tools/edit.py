import json, subprocess, sys, wave, math
import numpy as np
REC='/workspace/hackyard/rec'
OUTDIR='/workspace/hackyard/stillgoing/demo'
tl=json.load(open(f'{REC}/timeline.json'))
m=tl['marks']
segs=[
  (max(0,m['start']-0.2), m['fast1'], 1.0),
  (m['fast1'], m['check1'], float(tl['fast1'])),
  (m['check1'], m['fast2'], 1.0),
  (m['fast2'], m['final'], float(tl['fast2'])),
  (m['final'], m['end'], 1.0),
]
total=sum((b-a)/s for a,b,s in segs)
print('segments', [(round(a,2),round(b,2),s,round((b-a)/s,2)) for a,b,s in segs], 'total', round(total,2))
def remap(t):
    acc=0
    for a,b,s in segs:
        if a<=t<b: return acc+(t-a)/s, s
        acc+=(b-a)/s
    return None, None
# filtergraph
parts=[];labels=[]
for i,(a,b,s) in enumerate(segs):
    parts.append(f"[0:v]trim=start={a:.3f}:end={b:.3f},setpts=(PTS-STARTPTS)/{s}[v{i}]")
    labels.append(f"[v{i}]")
fg=';'.join(parts)+';'+''.join(labels)+f"concat=n={len(segs)}:v=1:a=0,fps=30,format=yuv420p[v]"
# audio
sr=44100; n=int((total+0.5)*sr); audio=np.zeros(n)
for e in tl['sfx']:
    et,s=remap(e['t'])
    if et is None or s>1.5: continue
    dur=max(0.04,min(0.4,e['dur'])); k=int(dur*sr); tt=np.arange(k)/sr; f=e['freq']
    if e['type']=='square': w=np.sign(np.sin(2*np.pi*f*tt))*0.5
    elif e['type']=='sawtooth': w=2*(tt*f-np.floor(0.5+tt*f))*0.5
    elif e['type']=='triangle': w=2*np.abs(2*(tt*f-np.floor(0.5+tt*f)))-1
    else: w=np.sin(2*np.pi*f*tt)
    env=np.minimum(1,tt/0.012)*np.exp(-tt/(dur/4))
    i0=int(et*sr); seg=w*env*0.35
    audio[i0:i0+len(seg)]+=seg[:max(0,n-i0)]
audio=np.clip(audio,-0.9,0.9)
with wave.open(f'{REC}/sfx.wav','wb') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes((audio*32767).astype('<i2').tobytes())
import os; os.makedirs(OUTDIR,exist_ok=True)
out=f'{OUTDIR}/still-going-demo.mp4'
cmd=['ffmpeg','-y','-loglevel','error','-i',f'{REC}/raw.webm','-i',f'{REC}/sfx.wav','-filter_complex',fg,'-map','[v]','-map','1:a','-c:v','libx264','-preset','slow','-crf','20','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',out]
subprocess.run(cmd,check=True)
print('wrote',out)
