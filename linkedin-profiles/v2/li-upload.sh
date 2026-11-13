#!/bin/bash
# Attach a local image to a LinkedIn file field through OpenCLI, without the system file picker.
# Why: LinkedIn opens the native file chooser, which OpenCLI's upload command cannot drive on LinkedIn ("Not allowed").
# This passes the file into the page in chunks and sets it on the field, the way a real file pick would.
# Usage:
#   1. Before clicking the button that opens the file picker, run:  li-upload.sh <session> --catch
#   2. Click the button (Upload photo, Change image, Choose thumbnail, Add an image).
#   3. Run:  li-upload.sh <session> <file> [css-of-file-input]
# The default input is the one caught in step 1 (input[data-oc-file]). LinkedIn's company cover uses
# #org-image-editor__change-photo-input and needs no catch.
S=$1
if [ "$2" = "--catch" ]; then
  opencli browser eval --session "$S" "(()=>{const o=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){if(this.type==='file'){document.querySelectorAll('input[data-oc-file]').forEach(x=>x.removeAttribute('data-oc-file'));this.setAttribute('data-oc-file','1');if(!this.isConnected){this.style.display='none';document.body.appendChild(this);}return;}return o.apply(this,arguments)};return 'caught'})()"
  exit
fi
F=$2; SEL=${3:-input[data-oc-file]}
B=$(base64 -i "$F" | tr -d '\n'); N=${#B}; CH=150000
opencli browser eval --session "$S" "window.__b64='';1" >/dev/null
for ((i=0;i<N;i+=CH)); do opencli browser eval --session "$S" "window.__b64+='${B:i:CH}';1" >/dev/null || exit 1; done
NAME=$(basename "$F"); MIME=image/png; [[ "$F" == *.jpg ]] && MIME=image/jpeg
SIZE=$(wc -c < "$F" | tr -d ' ')
opencli browser eval --session "$S" "(()=>{const s=atob(window.__b64);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);if(u.length!==$SIZE)return 'size mismatch';const f=new File([u],'$NAME',{type:'$MIME'});const inp=document.querySelector('$SEL');if(!inp)return 'no input';const dt=new DataTransfer();dt.items.add(f);inp.files=dt.files;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));delete HTMLInputElement.prototype.click;return 'attached '+u.length})()"
