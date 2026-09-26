"""Vectorize source/logo-color.png into logo-data.json and logo.svg (requires opencv-python-headless, potracer)."""
import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
import cv2, numpy as np, potrace, json, math
im=cv2.imread('source/logo-color.png',cv2.IMREAD_UNCHANGED)
a=im[:,:,3]
m=(a>127).astype(np.uint8)
n,lab,stats,cent=cv2.connectedComponentsWithStats(m,8)
def fmt(v): return ('%.1f'%v).rstrip('0').rstrip('.')
def trace_mask(mask, ox, oy):
    bm=potrace.Bitmap(~mask)
    plist=bm.trace(turdsize=10, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.2)
    parts=[]
    for curve in plist:
        sp=curve.start_point
        d='M%s %s'%(fmt(sp.x+ox),fmt(sp.y+oy))
        for seg in curve.segments:
            if seg.is_corner:
                d+='L%s %sL%s %s'%(fmt(seg.c.x+ox),fmt(seg.c.y+oy),fmt(seg.end_point.x+ox),fmt(seg.end_point.y+oy))
            else:
                d+='C%s %s %s %s %s %s'%(fmt(seg.c1.x+ox),fmt(seg.c1.y+oy),fmt(seg.c2.x+ox),fmt(seg.c2.y+oy),fmt(seg.end_point.x+ox),fmt(seg.end_point.y+oy))
        d+='Z'
        parts.append(d)
    return ''.join(parts)
comps=[]
for i in range(1,n):
    x,y,w,h,ar=stats[i]
    if ar<50: continue
    pad=4
    x0,y0=max(x-pad,0),max(y-pad,0)
    crop=(lab[y0:y+h+pad, x0:x+w+pad]==i)
    d=trace_mask(crop,x0,y0)
    comps.append(dict(x=int(x),y=int(y),w=int(w),h=int(h),d=d))
comps.sort(key=lambda c:(c['y']//100, c['x']))
json.dump(comps,open('/dev/null','w'))

im=cv2.imread('source/logo-color.png',cv2.IMREAD_UNCHANGED)
a=im[:,:,3]>127
cx,cy=920.0,642.0
pts=[]
N=720
for k in range(N):
    # start angle at top of neck (pointing up), go clockwise in screen coords (i.e. toward right)
    th=-math.pi/2 + 2*math.pi*k/N
    dx,dy=math.cos(th),math.sin(th)
    inside=False; r0=None; r1=None
    r=0.0
    while r<800:
        x=cx+dx*r; y=cy+dy*r
        xi,yi=int(round(x)),int(round(y))
        if 0<=xi<a.shape[1] and 0<=yi<a.shape[0] and a[yi,xi]:
            if r0 is None: r0=r
            r1=r
        elif r0 is not None and r1 is not None and r-r1>3:
            break
        r+=0.5
    rm=(r0+r1)/2
    pts.append((cx+dx*rm, cy+dy*rm, r1-r0))
arr=np.array(pts)
# smooth centerline
xy=arr[:,:2]
k=9
sm=np.zeros_like(xy)
for i in range(N):
    idx=[(i+j)%N for j in range(-k,k+1)]
    sm[i]=xy[idx].mean(0)
# resample by arc length to 240 points
seg=np.linalg.norm(np.diff(np.vstack([sm,sm[:1]]),axis=0),axis=1)
L=seg.sum(); print('length',L)
cum=np.concatenate([[0],np.cumsum(seg)])
closed=np.vstack([sm,sm[:1]])
M=180
out=[]
for s in np.linspace(0,L,M,endpoint=False):
    j=np.searchsorted(cum,s)-1
    t=(s-cum[j])/seg[j]
    out.append(closed[j]*(1-t)+closed[j+1]*t)
out=np.array(out)
# Catmull-Rom to cubic bezier closed path
def f(v): return '%.1f'%v
d='M%s %s'%(f(out[0][0]),f(out[0][1]))
for i in range(M):
    p0=out[(i-1)%M]; p1=out[i]; p2=out[(i+1)%M]; p3=out[(i+2)%M]
    c1=p1+(p2-p0)/6; c2=p2-(p3-p1)/6
    d+='C%s %s %s %s %s %s'%(f(c1[0]),f(c1[1]),f(c2[0]),f(c2[1]),f(p2[0]),f(p2[1]))
d+='Z'
cl=dict(d=d,length=float(L))

def find(x,y): return next(c for c in comps if c['x']==x and c['y']==y)
main=sorted([c for c in comps if 1130<=c['y']<1300],key=lambda c:c['x'])
sub=sorted([c for c in comps if c['y']>=1300],key=lambda c:c['x'])
data=dict(ring=find(296,289)['d'],dotL=find(550,151)['d'],dotR=find(1058,213)['d'],idot=find(1041,1079)['d'],
  main=[dict(d=c['d'],x=c['x'],y=c['y'],w=c['w'],h=c['h']) for c in main],
  sub=[dict(d=c['d'],x=c['x'],y=c['y'],w=c['w'],h=c['h']) for c in sub],
  center=cl['d'])
json.dump(data,open('logo-data.json','w'),separators=(',',':'))

def find(x,y): return next(c for c in comps if c['x']==x and c['y']==y)
ring=find(296,289)
stops=[(0,'#073f8e'),(0.2,'#453f7d'),(0.4,'#703c68'),(0.6,'#9c364c'),(0.8,'#c12830'),(1,'#d81718')]
grad=''.join('<stop offset="%g" stop-color="%s"/>'%s for s in stops)
out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1700 1600" width="1700" height="1600">',
 '<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="296" y1="0" x2="1404" y2="0">%s</linearGradient></defs>'%grad,
 '<path fill="url(#g)" fill-rule="evenodd" d="%s"/>'%ring['d'],
 '<path fill="#5c3973" d="%s"/>'%find(550,151)['d'],
 '<path fill="#ae1c3b" d="%s"/>'%find(1058,213)['d'],
 '<path fill="#d2161a" d="%s"/>'%find(1041,1079)['d']]
for c in comps:
    if c['y']>=1130: out.append('<path fill="#000" fill-rule="evenodd" d="%s"/>'%c['d'])
out.append('</svg>')
open('logo.svg','w').write('\n'.join(out))
