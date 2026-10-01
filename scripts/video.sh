set -e
FF=/private/tmp/claude-501/-Users-mudilisa-metropol--claude-worktrees-fahrschule-metropol-messe-f19a9e/eb2791df-faa2-489f-b68a-1a9919128727/scratchpad/ff/node_modules/ffmpeg-static/ffmpeg
SRC=assets-src/intro-original.mov
# HDR (HLG, iPhone) -> SDR Rec.709, leichtes Grading: etwas mehr Kontrast/Sättigung, Schärfe
P='zscale=tin=arib-std-b67:t=linear:npl=100:pin=bt2020:min=bt2020nc:rin=tv,format=gbrpf32le,tonemap=tonemap=hable:desat=0.2,zscale=t=bt709:m=bt709:p=bt709:r=tv,eq=contrast=1.07:saturation=1.14:gamma=0.97:brightness=0.01,unsharp=5:5:0.5,format=yuv420p,fps=25'
ENC=(-c:v libx264 -profile:v high -crf 24 -preset slow -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart)
# stumm, einmal abspielen, bleibt auf der Zeigegeste stehen
$FF -y -v error -i $SRC -vf "trim=0.15:7.15,setpts=PTS-STARTPTS,${P},fade=t=in:d=0.25" -an "${ENC[@]}" public/video/intro.mp4
# mit Ton (Sprache endet ca. 7,2 s)
$FF -y -v error -i $SRC -filter_complex "[0:v:0]trim=0.15:7.15,setpts=PTS-STARTPTS,${P},fade=t=in:d=0.25[v];[0:a:0]atrim=0.15:7.15,asetpts=PTS-STARTPTS,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.1,afade=t=out:st=6.9:d=0.1[a]" -map "[v]" -map "[a]" -c:a aac -b:a 128k "${ENC[@]}" public/video/intro-sound.mp4
# Poster (Standbild für Ladezeit / blockiertes Autoplay): freundlicher Moment bei 2,6 s
$FF -y -v error -ss 2.6 -i $SRC -frames:v 1 -vf "${P%,fps=25}" /tmp/poster.png
