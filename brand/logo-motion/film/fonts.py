import urllib.parse, subprocess, re, base64
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
JP="人と人との、つながり。縁が輪になる。そこは自由な場所灯すゆとり選べる余白を目の前の一人ひとりに世界一ゆるい会社決めすぎない詰めすぎないありがとうを生み出す存在意義最終目標行動基準"
specs=[("Shippori Mincho","500",JP),("Shippori Mincho","700",JP),("Zen Kaku Gothic New","500",JP+"・"),
       ("Libre Baskerville","400","Thanks Make"),("Barlow Condensed","700","MISSIONVALUEPLACEBRWFTHKY·—"),("Barlow","500","ABCDEFGHIJKLMNOPQRSTUVWXYZ·— 0123456789")]
css=""
for fam,w,txt in specs:
    txt=''.join(sorted(set(txt)))
    url="https://fonts.googleapis.com/css2?family=%s:wght@%s&text=%s"%(fam.replace(' ','+'),w,urllib.parse.quote(txt))
    c=subprocess.run(["curl","-sS","-A",UA,url],capture_output=True,text=True).stdout
    for m in re.finditer(r"src: url\((.*?)\)",c):
        data=subprocess.run(["curl","-sS",m.group(1)],capture_output=True).stdout
        css+="@font-face{font-family:'%s';font-weight:%s;src:url(data:font/woff2;base64,%s) format('woff2');}\n"%(fam,w,base64.b64encode(data).decode())
        print(fam,w,len(data))
open('fonts.css','w').write(css)
