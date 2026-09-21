// ---------- Demo data (shop-wide mock; in production this reads/writes Firebase) ----------
const CURRENT_STAFF={id:'เอ',name:'ช่างเอ'};
const CHAIR_POOL=['เก้าอี้ 1','เก้าอี้ 2','เก้าอี้ 3'];

let QUEUE=[
  {id:'A012',customer:'คุณสมชาย',services:['ตัดผม'],total:80,barberId:'เอ',status:'in_service',chair:'เก้าอี้ 2',startTime:new Date(Date.now()-8*60000),payment:null},
  {id:'A013',customer:'คุณวิชัย',services:['ตัดผม','โกนหนวด'],total:130,barberId:'เอ',status:'waiting',chair:null,startTime:null,payment:null},
  {id:'A014',customer:'คุณกิตติ',services:['สระผม'],total:40,barberId:null,status:'waiting',chair:null,startTime:null,payment:null},
  {id:'A010',customer:'คุณประยุทธ',services:['ตัดผม'],total:80,barberId:'เอ',status:'done',chair:'เก้าอี้ 1',date:'20/9/2569',payment:{status:'reported',reportedAt:new Date()}},
  {id:'A009',customer:'คุณอนันต์',services:['ตัดผม','สระผม'],total:120,barberId:'เอ',status:'done',chair:'เก้าอี้ 3',date:'20/9/2569',payment:{status:'confirmed',confirmedBy:'เอ'}},
];
let chairStatus='cutting'; // available | cutting | resting — cutting because A012 is in_service

// ---------- Login ----------
function login(){
  const u=document.getElementById('login-user').value.trim();
  if(!u){ toast('กรุณากรอก Username'); return; }
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('staff-name-badge').textContent=CURRENT_STAFF.name;
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  switchView('dashboard');
}
function logout(){
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
}

function switchView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  updateChairBadge();
  if(id==='dashboard') renderDashboard();
  if(id==='myqueue') renderMyQueue();
  if(id==='payment') renderPayment('all');
  if(id==='chair') renderChair();
  if(id==='history') renderHistory();
  if(id==='revenue') renderRevenue();
}
function updateChairBadge(){ document.getElementById('chair-badge').textContent='Chair: '+chairStatus.toUpperCase(); }

function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }

function myActiveQueue(){ return QUEUE.filter(q=>(q.barberId===CURRENT_STAFF.id||q.barberId===null) && (q.status==='waiting'||q.status==='in_service')); }

// ---------- Dashboard ----------
function renderDashboard(){
  const mine=QUEUE.filter(q=>q.barberId===CURRENT_STAFF.id);
  const waiting=mine.filter(q=>q.status==='waiting').length;
  const current=mine.find(q=>q.status==='in_service');
  const todayRevenue=mine.filter(q=>q.status==='done'&&q.payment&&q.payment.status==='confirmed').reduce((a,q)=>a+q.total,0);
  const pendingPay=mine.filter(q=>q.payment&&q.payment.status!=='confirmed').length;
  document.getElementById('dash-stats').innerHTML=`
    <div class="stat-card"><b>${waiting}</b><span>My Waiting Queue</span></div>
    <div class="stat-card"><b>${current?current.id:'-'}</b><span>Current Customer</span></div>
    <div class="stat-card"><b>${mine.filter(q=>q.status==='done').length}</b><span>Today's Customers</span></div>
    <div class="stat-card"><b>฿${todayRevenue}</b><span>Today's Revenue</span></div>
    <div class="stat-card"><b>${pendingPay}</b><span>Pending Payments</span></div>
    <div class="stat-card"><b>${chairStatus.toUpperCase()}</b><span>Chair</span></div>`;
  document.getElementById('dash-current').innerHTML=current?
    `<div class="card"><div class="info"><b>${current.id} · ${current.customer}</b><span>${current.services.join(', ')} · เริ่ม ${current.startTime.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</span></div><span class="badge in_service">IN SERVICE</span></div>`
    : `<div class="empty">ไม่มีลูกค้าปัจจุบัน</div>`;
}

// ---------- My Queue ----------
function renderMyQueue(){
  const list=myActiveQueue();
  const el=document.getElementById('myqueue-list');
  if(!list.length){ el.innerHTML='<div class="empty">วันนี้ยังไม่มีคิวของคุณ</div>'; return; }
  el.innerHTML=list.map(q=>{
    let actions='';
    if(q.barberId===null) actions+=`<button class="btn small secondary" onclick="takeQueue('${q.id}')">รับคิว</button>`;
    if(q.barberId===CURRENT_STAFF.id && q.status==='waiting') actions+=`<button class="btn small" onclick="startService('${q.id}')">เริ่มบริการ</button>
      <button class="btn small danger" onclick="confirmNoShow('${q.id}')">ลูกค้าไม่มา</button>`;
    if(q.barberId===CURRENT_STAFF.id && q.status==='in_service') actions+=`<button class="btn small" onclick="endService('${q.id}')">จบบริการ</button>`;
    return `<div class="card">
      <div class="info"><b>${q.id} · ${q.customer}</b><span>${q.services.join(', ')} · ฿${q.total}</span></div>
      <span class="badge ${q.status}">${q.status.toUpperCase()}</span>
      <div class="actions">${actions}</div>
    </div>`;
  }).join('');
}
function takeQueue(id){
  const q=QUEUE.find(q=>q.id===id); q.barberId=CURRENT_STAFF.id;
  toast('รับคิว '+id+' แล้ว'); renderMyQueue();
}
function startService(id){
  // Business rule: เปลี่ยน Queue และ Chair พร้อมกันเป็น transaction เดียว
  if(QUEUE.some(q=>q.barberId===CURRENT_STAFF.id&&q.status==='in_service')){ toast('คุณมีลูกค้าที่กำลังให้บริการอยู่แล้ว'); return; }
  const q=QUEUE.find(q=>q.id===id);
  q.status='in_service'; q.chair=CHAIR_POOL[Math.floor(Math.random()*CHAIR_POOL.length)]; q.startTime=new Date();
  chairStatus='cutting';
  toast('เริ่มบริการ '+id); renderMyQueue(); updateChairBadge();
}
function confirmNoShow(id){
  showModal(`ยืนยันว่าลูกค้า ${id} ไม่มาตามคิวหรือไม่?`,'การกระทำนี้จะถูกเก็บสถิติแยกจากการยกเลิก',[
    {label:'ยืนยัน',cls:'danger',fn:()=>{ QUEUE.find(q=>q.id===id).status='no_show'; toast(id+' ถูกบันทึกเป็น No-show'); renderMyQueue(); closeModal(); }},
    {label:'ยกเลิก',cls:'secondary',fn:closeModal}
  ]);
}
function endService(id){
  const q=QUEUE.find(q=>q.id===id);
  q.status='done'; q.date=new Date().toLocaleDateString('th-TH'); q.payment={status:'pending'};
  chairStatus='available';
  toast('จบบริการ '+id+' — รอการชำระเงิน'); renderMyQueue(); renderDashboard(); updateChairBadge();
}

// ---------- Chair Status ----------
function renderChair(){
  const inService=QUEUE.some(q=>q.barberId===CURRENT_STAFF.id&&q.status==='in_service');
  document.getElementById('chair-card').innerHTML=`
    <div class="card">
      <div class="info"><b>สถานะเก้าอี้ปัจจุบัน</b><span>${chairStatus==='cutting'?'🔴 Cutting':chairStatus==='resting'?'🟡 Resting':'🟢 Available'}</span></div>
      <div class="actions">
        <button class="btn small ${chairStatus==='available'?'':'secondary'}" onclick="setChair('available')" ${inService?'disabled':''}>Available</button>
        <button class="btn small ${chairStatus==='resting'?'':'secondary'}" onclick="setChair('resting')" ${inService?'disabled':''}>Resting</button>
      </div>
    </div>
    ${inService?'<p class="note">ห้ามเปลี่ยนเป็น Resting ระหว่างมีลูกค้าอยู่บนเก้าอี้</p>':''}
  `;
}
function setChair(s){
  if(QUEUE.some(q=>q.barberId===CURRENT_STAFF.id&&q.status==='in_service')){ toast('ไม่สามารถเปลี่ยนได้ระหว่างให้บริการ'); return; }
  chairStatus=s; renderChair(); updateChairBadge();
}

// ---------- Payment Verification ----------
function renderPayment(filter){
  document.getElementById('pay-filters').innerHTML=['all','pending','reported','confirmed'].map(f=>
    `<button class="${filter===f?'on':''}" onclick="renderPayment('${f}')">${f==='all'?'ทั้งหมด':f}</button>`).join('');
  let rows=QUEUE.filter(q=>q.payment);
  if(filter!=='all') rows=rows.filter(q=>q.payment.status===filter);
  const el=document.getElementById('payment-list');
  if(!rows.length){ el.innerHTML='<div class="empty">ไม่มีรายการ</div>'; return; }
  el.innerHTML=rows.map(q=>`
    <div class="card">
      <div class="info"><b>${q.id} · ${q.customer}</b><span>฿${q.total} · ${q.date||''}</span></div>
      <span class="badge ${q.payment.status}">${q.payment.status==='reported'?'Customer Reported':q.payment.status}</span>
      <div class="actions">
        ${q.payment.status==='pending'?`<button class="btn small secondary" onclick="markReported('${q.id}')">จำลอง: ลูกค้าแจ้งชำระเงิน</button>`:''}
        ${q.payment.status==='reported'?`<button class="btn small" onclick="confirmPayment('${q.id}')">ยืนยันการชำระเงิน</button>`:''}
      </div>
    </div>`).join('');
}
function markReported(id){ QUEUE.find(q=>q.id===id).payment={status:'reported',reportedAt:new Date()}; renderPayment('all'); }
function confirmPayment(id){
  const q=QUEUE.find(q=>q.id===id);
  q.payment={status:'confirmed',confirmedBy:CURRENT_STAFF.id,confirmedAt:new Date()};
  toast('ยืนยันการชำระเงิน '+id+' แล้ว');
  renderPayment('all'); renderDashboard();
}

// ---------- History / Revenue ----------
function renderHistory(){
  const rows=QUEUE.filter(q=>q.barberId===CURRENT_STAFF.id&&q.status==='done');
  const el=document.getElementById('history-list');
  if(!rows.length){ el.innerHTML='<div class="empty">ยังไม่มีประวัติ</div>'; return; }
  el.innerHTML=rows.map(q=>`<div class="card"><div class="info"><b>${q.id} · ${q.customer}</b><span>${q.services.join(', ')} · ${q.date}</span></div><span class="badge ${q.payment?q.payment.status:'pending'}">${q.payment?q.payment.status:'pending'}</span><div class="info"><b>฿${q.total}</b></div></div>`).join('');
}
function renderRevenue(){
  const confirmed=QUEUE.filter(q=>q.barberId===CURRENT_STAFF.id&&q.status==='done'&&q.payment&&q.payment.status==='confirmed');
  const total=confirmed.reduce((a,q)=>a+q.total,0);
  document.getElementById('revenue-stats').innerHTML=`
    <div class="stat-card"><b>฿${total}</b><span>Today's Revenue</span></div>
    <div class="stat-card"><b>฿${total}</b><span>Weekly Revenue (demo)</span></div>
    <div class="stat-card"><b>฿${total}</b><span>Monthly Revenue (demo)</span></div>
    <div class="stat-card"><b>${confirmed.length}</b><span>Number of Customers</span></div>
    <div class="stat-card"><b>${confirmed.length}</b><span>Completed Services</span></div>`;
  document.getElementById('note-rule')?.remove();
}

// ---------- Modal ----------
function showModal(title,desc,buttons){
  document.getElementById('modal-content').innerHTML=`<h3>${title}</h3><p>${desc}</p><div class="modal-actions">${buttons.map((b,i)=>`<button class="btn ${b.cls}" id="modal-btn-${i}">${b.label}</button>`).join('')}</div>`;
  buttons.forEach((b,i)=>document.getElementById('modal-btn-'+i).onclick=b.fn);
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); }
