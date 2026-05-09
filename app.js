const DB_NAME="khobaukyuc_db_v1",STORE="memories",ROOT="KHOBAUKYUC";
const AGE_STAGES=Array.from({length:18},(_,i)=>`${String(i).padStart(2,"0")}_${String(i+1).padStart(2,"0")}_TUOI`);
const EVENT_TYPES=["SINHNHAT","NGAYDAUDIHOC","GIADINH","DULICH","THANHTICH","ONGBA","TET","DIHOC","VUICHOI","KHAC"],EMOTIONS=["vui","cam_dong","hanh_phuc","tu_hao","dang_nho","bat_ngo","yeu_thuong"];
const FOLDER_STRUCTURE=["00_CONFIG/memories.json","00_CONFIG/folder_map.json","00_CONFIG/settings.json","00_CONFIG/backup/","00_CONFIG/cover.jpg",...AGE_STAGES.flatMap(a=>[`${a}/ANH_OFFLINE/`,`${a}/ANH_GOC_GOOGLEDRIVE/`,`${a}/VIDEO_YOUTUBE/`,`${a}/GHICHU/`]),"SU_KIEN_DAC_BIET/SINHNHAT/","SU_KIEN_DAC_BIET/NGAYDAUDIHOC/","SU_KIEN_DAC_BIET/GIADINH/","SU_KIEN_DAC_BIET/DULICH/","SU_KIEN_DAC_BIET/THANHTICH/","SU_KIEN_DAC_BIET/ONGBA/","SU_KIEN_DAC_BIET/TET/"];
let db,memories=[],editingId=null,currentAge="all",settings=JSON.parse(localStorage.getItem("khobaukyuc_settings")||`{"rootFolder":"${ROOT}","driveRootUrl":"","apiKey":"","clientId":""}`);
const $=id=>document.getElementById(id);
function toast(m){const e=document.createElement("div");e.className="toast";e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
function fmtBytes(n){if(!n)return"0 MB";const u=["B","KB","MB","GB"];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return n.toFixed(i?1:0)+" "+u[i]}
function slug(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}
function yymmddFromDate(v){if(!v)return"";const [y,m,d]=v.split("-");return y.slice(-2)+m+d}
function dateFromYYMMDD(c){return /^\d{6}$/.test(c)?`20${c.slice(0,2)}-${c.slice(2,4)}-${c.slice(4,6)}`:""}
function makeId(d){return `${d||yymmddFromDate(new Date().toISOString().slice(0,10))}_${String(Date.now()).slice(-6)}`}
function esc(s){return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:"id"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function os(m="readonly"){return db.transaction(STORE,m).objectStore(STORE)}function getAll(){return new Promise((res,rej)=>{const r=os().getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}function putMemory(m){return new Promise((res,rej)=>{const r=os("readwrite").put(m);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}function delMemory(id){return new Promise((res,rej)=>{const r=os("readwrite").delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
async function refresh(){memories=(await getAll()).sort((a,b)=>(b.date_code||"").localeCompare(a.date_code||""));renderAll()}
function renderAll(){renderAges();renderFilters();renderGrid();renderStats()}
function renderAges(){const counts=Object.fromEntries(AGE_STAGES.map(a=>[a,memories.filter(m=>m.age_stage===a).length]));$("ageList").innerHTML=`<button class="ageBtn ${currentAge==="all"?"active":""}" data-age="all">TAT_CA<small>${memories.length} ky niem</small></button>`+AGE_STAGES.map(a=>`<button class="ageBtn ${currentAge===a?"active":""}" data-age="${a}">${a}<small>${counts[a]} ky niem</small></button>`).join("");document.querySelectorAll(".ageBtn").forEach(b=>b.onclick=()=>{currentAge=b.dataset.age;renderAll()})}
function renderFilters(){$("ageFilter").innerHTML=`<option value="all">Tat ca tuoi</option>`+AGE_STAGES.map(a=>`<option value="${a}">${a}</option>`).join("");$("ageFilter").value=currentAge}
function filteredMemories(){const q=slug($("searchInput").value),type=$("typeFilter").value;return memories.filter(m=>{if(currentAge!=="all"&&m.age_stage!==currentAge)return false;if($("ageFilter").value!=="all"&&m.age_stage!==$("ageFilter").value)return false;if(type==="offline"&&!(m.photos||[]).length)return false;if(type==="youtube"&&!m.youtube_link)return false;if(type==="drive"&&!(m.drive_image_folder||m.drive_video_link))return false;if(type==="fav"&&!m.favorite)return false;if(q&&!slug([m.title,m.note,(m.tags||[]).join(" "),m.date_code,m.age_stage,m.event_type].join(" ")).includes(q))return false;return true})}
function renderGrid(){const list=filteredMemories();$("contentTitle").textContent=currentAge==="all"?"Tat ca ky niem":currentAge;if(!list.length){$("memoryGrid").innerHTML=`<div class="note">Chua co ky niem nao. Bam “Them ky niem” de bat dau.</div>`;return}$("memoryGrid").innerHTML=list.map(m=>{const img=m.photos?.[0]?.dataUrl;return `<article class="card"><div class="thumb">${img?`<img src="${img}">`:"💖"}<button class="fav" data-id="${m.id}">${m.favorite?"❤️":"🤍"}</button></div><div class="cardBody"><h4>${esc(m.title||"Ky niem")}</h4><p>${m.date_code||""} • ${m.age_stage||""}</p><p>${esc((m.note||"").slice(0,90))}</p><div class="meta"><span>${m.event_type||"KHAC"}</span><span>${m.emotion||"vui"}</span>${m.youtube_link?"<span>YouTube</span>":""}${m.drive_image_folder?"<span>Drive</span>":""}</div><div class="cardActions"><button class="mini view" data-id="${m.id}">Xem</button><button class="mini edit" data-id="${m.id}">Sua</button></div></div></article>`}).join("");document.querySelectorAll(".view").forEach(b=>b.onclick=()=>openViewer(b.dataset.id));document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>openEditor(b.dataset.id));document.querySelectorAll(".fav").forEach(b=>b.onclick=async()=>{const m=memories.find(x=>x.id===b.dataset.id);m.favorite=!m.favorite;await putMemory(m);await refresh()})}
function renderStats(){$("memoryCount").textContent=memories.length;$("photoCount").textContent=memories.reduce((s,m)=>s+(m.photos?.length||0),0);$("onlineCount").textContent=memories.reduce((s,m)=>s+(m.youtube_link?1:0)+(m.drive_image_folder?1:0)+(m.drive_video_link?1:0),0);$("storageSize").textContent=fmtBytes(memories.reduce((s,m)=>s+(m.photos||[]).reduce((a,p)=>a+(p.size||0),0),0))}
function initSelects(){$("ageInput").innerHTML=AGE_STAGES.map(a=>`<option value="${a}">${a}</option>`).join("");$("eventInput").innerHTML=EVENT_TYPES.map(e=>`<option value="${e}">${e}</option>`).join("");$("emotionInput").innerHTML=EMOTIONS.map(e=>`<option value="${e}">${e}</option>`).join("")}
function folderHint(){const a=$("ageInput").value||"06_07_TUOI",e=$("eventInput").value||"KHAC";$("folderHintText").textContent=[`${ROOT}/${a}/ANH_GOC_GOOGLEDRIVE/`,`${ROOT}/${a}/VIDEO_YOUTUBE/`,`${ROOT}/${a}/GHICHU/`,`${ROOT}/SU_KIEN_DAC_BIET/${e}/`].join("\n")}
function openEditor(id=null){editingId=id;const m=id?memories.find(x=>x.id===id):null;$("editorTitle").textContent=id?"Sua ky niem":"Them ky niem";$("deleteMemoryBtn").style.display=id?"inline-block":"none";$("dateInput").value=m?.date_iso||new Date().toISOString().slice(0,10);$("dateCodeInput").value=m?.date_code||yymmddFromDate($("dateInput").value);$("ageInput").value=m?.age_stage||"06_07_TUOI";$("eventInput").value=m?.event_type||"KHAC";$("titleInput").value=m?.title||"";$("emotionInput").value=m?.emotion||"vui";$("tagsInput").value=(m?.tags||[]).join(", ");$("noteInput").value=m?.note||"";$("driveImageInput").value=m?.drive_image_folder||"";$("youtubeInput").value=m?.youtube_link||"";$("driveVideoInput").value=m?.drive_video_link||"";$("photoInput").value="";folderHint();$("editor").classList.add("open")}
function closeEditor(){$("editor").classList.remove("open")}
async function compressImage(file,max=1600,quality=.82){return new Promise((res,rej)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{let w=img.width,h=img.height;if(Math.max(w,h)>max){const r=max/Math.max(w,h);w=Math.round(w*r);h=Math.round(h*r)}const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);const dataUrl=c.toDataURL("image/jpeg",quality);URL.revokeObjectURL(url);res({name:file.name,type:"image/jpeg",dataUrl,size:Math.round(dataUrl.length*.75)})};img.onerror=rej;img.src=url})}
async function saveMemory(){const dateIso=$("dateInput").value,dateCode=($("dateCodeInput").value||yymmddFromDate(dateIso)).trim();if(!/^\d{6}$/.test(dateCode)){toast("Ngay he thong phai la YYMMDD, vi du 260509");return}const old=editingId?memories.find(x=>x.id===editingId):null,files=Array.from($("photoInput").files||[]);let photos=old?.photos||[];if(files.length){toast("Dang nen anh offline...");for(const f of files)photos.push(await compressImage(f))}const title=$("titleInput").value.trim()||"Ky niem";const memory={id:old?.id||makeId(dateCode),date_iso:dateIso||dateFromYYMMDD(dateCode),date_code:dateCode,age_stage:$("ageInput").value,event_type:$("eventInput").value,title,title_slug:slug(title),emotion:$("emotionInput").value,tags:$("tagsInput").value.split(",").map(x=>slug(x)).filter(Boolean),note:$("noteInput").value.trim(),photos,drive_image_folder:$("driveImageInput").value.trim(),youtube_link:$("youtubeInput").value.trim(),youtube_embed:youtubeEmbed($("youtubeInput").value.trim()),drive_video_link:$("driveVideoInput").value.trim(),favorite:old?.favorite||false,created_at:old?.created_at||Date.now(),updated_at:Date.now(),suggested_folders:{image:`${ROOT}/${$("ageInput").value}/ANH_GOC_GOOGLEDRIVE/`,youtube:`${ROOT}/${$("ageInput").value}/VIDEO_YOUTUBE/`,note:`${ROOT}/${$("ageInput").value}/GHICHU/`,event:`${ROOT}/SU_KIEN_DAC_BIET/${$("eventInput").value}/`}};await putMemory(memory);await refresh();closeEditor();toast("Da luu ky niem")}
async function deleteCurrent(){if(editingId&&confirm("Xoa ky niem nay?")){await delMemory(editingId);await refresh();closeEditor();toast("Da xoa")}}
function youtubeEmbed(url){const s=String(url||"");let id="";if(s.includes("youtu.be/"))id=s.split("youtu.be/")[1].split(/[?&]/)[0];else if(s.includes("watch?v="))id=s.split("watch?v=")[1].split("&")[0];else if(s.includes("/embed/"))id=s.split("/embed/")[1].split(/[?&]/)[0];return id?`https://www.youtube.com/embed/${id}`:""}
function openViewer(id){const m=memories.find(x=>x.id===id);if(!m)return;$("viewerTitle").textContent=m.title;const media=(m.photos||[]).map(p=>`<img src="${p.dataUrl}">`).join(""),yt=m.youtube_embed?`<div class="youtubeBox"><iframe src="${m.youtube_embed}" allowfullscreen></iframe></div>`:"";$("viewerBody").innerHTML=`<h2>${esc(m.title)}</h2><p><b>${m.date_code}</b> • ${m.age_stage} • ${m.event_type} • ${m.emotion}</p><p>${esc(m.note)}</p><div class="meta">${(m.tags||[]).map(t=>`<span>${t}</span>`).join("")}</div>${yt}<div class="viewerMedia">${media}</div>${m.drive_image_folder?`<p><a href="${m.drive_image_folder}" target="_blank">Mo thu muc anh Google Drive</a></p>`:""}${m.drive_video_link?`<p><a href="${m.drive_video_link}" target="_blank">Mo video Google Drive</a></p>`:""}`;$("viewer").classList.add("open")}
function exportBackup(){const backup={app_name:"KHOBAUKYUC",version:"1.0",root_folder:ROOT,exported_at:new Date().toISOString(),folder_structure:FOLDER_STRUCTURE,settings,memories};const name=`${yymmddFromDate(new Date().toISOString().slice(0,10))}_backup_memories.json`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:"application/json;charset=utf-8"}));a.download=name;a.click();toast("Da export backup JSON")}
async function importBackup(file){try{const data=JSON.parse(await file.text());if(!Array.isArray(data.memories))throw new Error("File khong co memories");if(!confirm("Import se them/cap nhat ky niem tu backup. Tiep tuc?"))return;for(const m of data.memories)await putMemory(m);if(data.settings){settings={...settings,...data.settings};localStorage.setItem("khobaukyuc_settings",JSON.stringify(settings))}await refresh();toast("Da phuc hoi backup")}catch(e){toast("Loi import: "+e.message)}}
function copyStructure(){const text=`${ROOT}/\n`+FOLDER_STRUCTURE.map(x=>"  "+x).join("\n");navigator.clipboard.writeText(text);toast("Da copy cau truc thu muc")}
function checkStructure(){toast("Ban V1 kiem tra bang cau truc text. Ban Pro se quet Drive API de bao thieu thu muc.")}
function extractFolderId(url){const s=String(url||"");let m=s.match(/folders\/([a-zA-Z0-9_-]+)/);if(m)return m[1];m=s.match(/[?&]id=([a-zA-Z0-9_-]+)/);return m?m[1]:""}
async function testDrivePublic(){const apiKey=$("apiKeyInput").value.trim(),id=extractFolderId($("driveRootInput").value.trim());if(!apiKey||!id){toast("Can nhap API Key va link folder Drive");return}try{const q=encodeURIComponent(`'${id}' in parents and trashed=false`),url=`https://www.googleapis.com/drive/v3/files?q=${q}&key=${encodeURIComponent(apiKey)}&fields=files(id,name,mimeType,webViewLink,thumbnailLink)`;const res=await fetch(url),data=await res.json();if(!res.ok)throw new Error(data.error?.message||"Drive API loi");toast(`Doc duoc ${data.files?.length||0} muc trong folder`)}catch(e){toast("Loi Drive: "+e.message)}}
async function syncDrivePublic(){const apiKey=settings.apiKey,id=extractFolderId(settings.driveRootUrl);if(!apiKey||!id){toast("Hay vao Cai dat nhap API Key va link KHOBAUKYUC");return}try{const q=encodeURIComponent(`'${id}' in parents and trashed=false`),url=`https://www.googleapis.com/drive/v3/files?q=${q}&key=${encodeURIComponent(apiKey)}&fields=files(id,name,mimeType,webViewLink,thumbnailLink)`;const res=await fetch(url),data=await res.json();if(!res.ok)throw new Error(data.error?.message||"Drive API loi");toast(`Da quet Drive root: ${data.files?.length||0} muc. Ban Pro se quet de quy thu muc con.`)}catch(e){toast("Loi dong bo Drive: "+e.message)}}
function openSettings(){$("rootFolderInput").value=settings.rootFolder||ROOT;$("driveRootInput").value=settings.driveRootUrl||"";$("apiKeyInput").value=settings.apiKey||"";$("clientIdInput").value=settings.clientId||"";$("settings").classList.add("open")}
function saveSettings(){const root=$("rootFolderInput").value.trim();if(root!==ROOT){toast("Ten root bat buoc la KHOBAUKYUC");return}settings={rootFolder:root,driveRootUrl:$("driveRootInput").value.trim(),apiKey:$("apiKeyInput").value.trim(),clientId:$("clientIdInput").value.trim()};localStorage.setItem("khobaukyuc_settings",JSON.stringify(settings));$("settings").classList.remove("open");toast("Da luu cau hinh")}
function storyMode(){const list=filteredMemories();if(!list.length){toast("Chua co ky niem de chay story");return}let i=0;const o=document.createElement("div");o.className="story";const render=()=>{const m=list[i%list.length],img=m.photos?.[0]?.dataUrl;o.innerHTML=`<button class="secondary storyClose">Dong</button><div class="storyText">${img?`<img src="${img}">`:"<div style='font-size:90px'>💖</div>"}<h2>${esc(m.title)}</h2><p>${m.date_code} • ${m.age_stage}</p><p>${esc(m.note||"")}</p></div>`;o.querySelector(".storyClose").onclick=()=>o.remove();i++};render();document.body.appendChild(o);const timer=setInterval(()=>{if(!document.body.contains(o)){clearInterval(timer);return}render()},4500)}
$("addBtn").onclick=()=>openEditor();$("closeEditorBtn").onclick=closeEditor;$("saveMemoryBtn").onclick=saveMemory;$("deleteMemoryBtn").onclick=deleteCurrent;$("dateInput").onchange=()=>{$("dateCodeInput").value=yymmddFromDate($("dateInput").value)};$("ageInput").onchange=folderHint;$("eventInput").onchange=folderHint;$("settingsBtn").onclick=openSettings;$("closeSettingsBtn").onclick=()=>$("settings").classList.remove("open");$("saveSettingsBtn").onclick=saveSettings;$("testDriveBtn").onclick=testDrivePublic;$("backupBtn").onclick=exportBackup;$("importBtn").onclick=()=>$("importInput").click();$("importInput").onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0])};$("copyStructureBtn").onclick=copyStructure;$("checkStructureBtn").onclick=checkStructure;$("syncDriveBtn").onclick=syncDrivePublic;$("searchInput").oninput=renderGrid;$("ageFilter").onchange=e=>{currentAge=e.target.value;renderAll()};$("typeFilter").onchange=renderGrid;$("clearBtn").onclick=()=>{$("searchInput").value="";$("typeFilter").value="all";currentAge="all";renderAll()};$("storyBtn").onclick=storyMode;$("closeViewerBtn").onclick=()=>$("viewer").classList.remove("open");$("viewer").onclick=e=>{if(e.target.id==="viewer")$("viewer").classList.remove("open")};["editor","settings"].forEach(id=>$(id).onclick=e=>{if(e.target.id===id)$(id).classList.remove("open")});
(async()=>{db=await openDB();initSelects();folderHint();await refresh()})();


/* ===== KHOBAUKYUC V2 upgrades ===== */
function agePath(age=currentAge){
  const a = age && age !== "all" ? age : "06_07_TUOI";
  return `${ROOT}/${a}/`;
}
function ageSubPaths(age=currentAge){
  const a = age && age !== "all" ? age : "06_07_TUOI";
  return [
    `${ROOT}/${a}/`,
    `${ROOT}/${a}/ANH_OFFLINE/`,
    `${ROOT}/${a}/ANH_GOC_GOOGLEDRIVE/`,
    `${ROOT}/${a}/VIDEO_YOUTUBE/`,
    `${ROOT}/${a}/GHICHU/`,
    `${ROOT}/00_CONFIG/backup/`
  ];
}
function updateCurrentPathBox(){
  if(!$("currentPathText")) return;
  const a = currentAge && currentAge !== "all" ? currentAge : "06_07_TUOI";
  $("currentPathText").textContent = ageSubPaths(a).join("\n");
}
function copyText(text,msg="Da copy"){
  navigator.clipboard.writeText(text);
  toast(msg);
}
function openUrl(url,msg){
  if(!url){toast(msg||"Chua co link Google Drive trong Cai dat");return}
  window.open(url,"_blank");
}
function backupChecklist(){
  const a = currentAge && currentAge !== "all" ? currentAge : "06_07_TUOI";
  return [
    "CHECKLIST BACKUP THU CONG - KHOBAUKYUC",
    "",
    "1. Bam nut Backup trong app de tai file JSON.",
    `2. Luu file backup vao: ${ROOT}/00_CONFIG/backup/`,
    `3. Anh goc luu vao: ${ROOT}/${a}/ANH_GOC_GOOGLEDRIVE/`,
    `4. Video YouTube luu link vao: ${ROOT}/${a}/VIDEO_YOUTUBE/`,
    `5. Ghi chu su kien luu vao: ${ROOT}/${a}/GHICHU/`,
    "6. Dinh ky copy memories.json/backup JSON len Google Drive.",
    "",
    "Quy tac ten file:",
    "YYMMDD_su-kien_001.jpg",
    "YYMMDD_su-kien_youtube.txt",
    "YYMMDD_su-kien_ghichu.txt"
  ].join("\n");
}
function suggestedFileNames(){
  const dateCode = ($("dateCodeInput")?.value || yymmddFromDate($("dateInput")?.value || "") || "260509").trim();
  const eventSlug = slug($("titleInput")?.value || $("eventInput")?.value || "ky-niem");
  return [
    `${dateCode}_${eventSlug}_001.jpg`,
    `${dateCode}_${eventSlug}_youtube.txt`,
    `${dateCode}_${eventSlug}_ghichu.txt`,
    `${dateCode}_${eventSlug}_backup.json`
  ].join("\n");
}
function updateFileSuggest(){
  let box = document.getElementById("fileSuggestBox");
  if(!box && $("folderHintText")){
    box = document.createElement("div");
    box.id = "fileSuggestBox";
    box.className = "fileSuggest";
    $("folderHintText").parentElement.appendChild(box);
  }
  if(box) box.innerHTML = `<b>Ten file goi y:</b><pre>${suggestedFileNames()}</pre>`;
}
const _oldFolderHint = folderHint;
folderHint = function(){
  _oldFolderHint();
  updateFileSuggest();
};
const _oldOpenEditor = openEditor;
openEditor = function(id=null, presetAge=null){
  _oldOpenEditor(id);
  if(!id && presetAge){
    $("ageInput").value = presetAge;
    folderHint();
  }
  updateFileSuggest();
};
const _oldRenderAges = renderAges;
renderAges = function(){
  const counts=Object.fromEntries(AGE_STAGES.map(a=>[a,memories.filter(m=>m.age_stage===a).length]));
  $("ageList").innerHTML=`<button class="ageBtn ${currentAge==="all"?"active":""}" data-age="all"><div class="ageBtnRow"><button class="ageBtnMain" data-age-main="all">TAT_CA<small>${memories.length} ky niem</small></button><button class="ageAddBtn" data-age-add="06_07_TUOI">+</button></div></button>`+
  AGE_STAGES.map(a=>`<button class="ageBtn ${currentAge===a?"active":""}" data-age="${a}"><div class="ageBtnRow"><button class="ageBtnMain" data-age-main="${a}">${a}<small>${counts[a]} ky niem</small></button><button class="ageAddBtn" data-age-add="${a}">+</button></div></button>`).join("");
  document.querySelectorAll("[data-age-main]").forEach(b=>b.onclick=(e)=>{e.stopPropagation();currentAge=b.dataset.ageMain;renderAll()});
  document.querySelectorAll("[data-age-add]").forEach(b=>b.onclick=(e)=>{e.stopPropagation();openEditor(null,b.dataset.ageAdd)});
  updateCurrentPathBox();
};
const _oldRenderGrid = renderGrid;
renderGrid = function(){
  _oldRenderGrid();
  document.querySelectorAll(".cardActions").forEach(actions=>{
    const id = actions.querySelector(".view")?.dataset.id;
    if(id && !actions.querySelector(".noteExport")){
      const btn = document.createElement("button");
      btn.className = "mini noteExport";
      btn.textContent = "Xuat TXT";
      btn.onclick = () => exportMemoryTxt(id);
      actions.appendChild(btn);
    }
  });
  updateCurrentPathBox();
};
function exportMemoryTxt(id){
  const m = memories.find(x=>x.id===id);
  if(!m) return;
  const eventSlug = slug(m.title || m.event_type || "ky-niem");
  const filename = `${m.date_code || "260509"}_${eventSlug}_ghichu.txt`;
  const content = [
    "KHOBAUKYUC - GHICHU KY NIEM",
    "",
    `ID: ${m.id}`,
    `Ngay: ${m.date_code}`,
    `Tuoi: ${m.age_stage}`,
    `Su kien: ${m.event_type}`,
    `Tieu de: ${m.title}`,
    `Cam xuc: ${m.emotion}`,
    `Tags: ${(m.tags||[]).join(", ")}`,
    "",
    "Ghi chu:",
    m.note || "",
    "",
    `Google Drive anh: ${m.drive_image_folder || ""}`,
    `YouTube: ${m.youtube_link || ""}`,
    `Google Drive video: ${m.drive_video_link || ""}`,
    "",
    "Thu muc goi y:",
    m.suggested_folders ? Object.values(m.suggested_folders).join("\n") : ageSubPaths(m.age_stage).join("\n")
  ].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));
  a.download=filename;
  a.click();
  toast("Da xuat file ghi chu TXT");
}
function folderUrlForAge(age){
  // V2 opens root Drive link because subfolder URL needs Drive API mapping.
  return settings.driveRootUrl || "";
}
function bindV2Buttons(){
  if($("openRootDriveBtn")) $("openRootDriveBtn").onclick=()=>openUrl(settings.driveRootUrl,"Chua nhap link KHOBAUKYUC trong Cai dat");
  if($("openAgeDriveBtn")) $("openAgeDriveBtn").onclick=()=>openUrl(folderUrlForAge(currentAge),"Ban V2 mo root Drive. Ban Pro se map chinh xac folder tuoi bang API.");
  if($("openBackupDriveBtn")) $("openBackupDriveBtn").onclick=()=>openUrl(settings.driveRootUrl,"Chua nhap link KHOBAUKYUC trong Cai dat");
  if($("copyRootPathBtn")) $("copyRootPathBtn").onclick=()=>copyText(`${ROOT}/`,"Da copy root path");
  if($("copyAgePathBtn")) $("copyAgePathBtn").onclick=()=>copyText(ageSubPaths(currentAge).join("\n"),"Da copy duong dan tuoi dang xem");
  if($("copyBackupChecklistBtn")) $("copyBackupChecklistBtn").onclick=()=>copyText(backupChecklist(),"Da copy checklist backup");
}
["dateCodeInput","dateInput","titleInput","eventInput"].forEach(id=>{
  setTimeout(()=>{ if($(id)) $(id).addEventListener("input", updateFileSuggest); },0);
});
const _oldRenderAll = renderAll;
renderAll = function(){
  _oldRenderAll();
  updateCurrentPathBox();
};
setTimeout(()=>{bindV2Buttons();updateCurrentPathBox();},300);
