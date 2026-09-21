// ---------- Demo data (shop-wide mock; production reads/writes Firebase) ----------
let SERVICES=[
  {id:'cut',name:'ตัดผม',price:80,duration:30,desc:'ทรงคลาสสิก',active:true},
  {id:'shave',name:'โกนหนวด',price:50,duration:15,desc:'โกนด้วยมีดโกน',active:true},
  {id:'wash',name:'สระผม',price:40,duration:15,desc:'สระ+นวดหนังศีรษะ',active:true},
  {id:'color',name:'ทำสีผม',price:250,duration:60,desc:'ปิดชั่วคราว',active:false}
];
let STAFF=[
  {id:'เอ',username:'staff_a',name:'ช่างเอ',role:'barber',status:'active',lastLogin:'20/9/2569 09:12'},
  {id:'บี',username:'staff_b',name:'ช่างบี',role:'barber',status:'active',lastLogin:'20/9/2569 08:50'},
  {id:'ซี',username:'staff_c',name:'ช่างซี',role:'barber',status:'active',lastLogin:'18/9/2569 17:30'},
  {id:'owner',username:'admin',name:'เจ้าของร้าน',role:'admin',status:'active',lastLogin:'20/9/2569 07:00'}
];
let BARBER_PROFILES=[
  {staffId:'เอ',specialty:'ทรงคลาสสิก',phone:'081-111-1111',workingDays:'จ-ส',dayOff:false},
  {staffId:'บี',specialty:'เทรนด์เกาหลี',phone:'082-222-2222',workingDays:'จ-ส',dayOff:false},
  {staffId:'ซี',specialty:'เคราและหนวด',phone:'083-333-3333',workingDays:'อ-อา',dayOff:true}
];
let CHAIRS=[{id:'เก้าอี้ 1',status:'available'},{id:'เก้าอี้ 2',status:'cutting'},{id:'เก้าอี้ 3',status:'cutting'}];
let QUEUE=[
  {id:'A012',customer:'คุณสมชาย',services:['ตัดผม'],total:80,barberId:'เอ',status:'in_service',date:'20/9/2569',payment:null},
  {id:'A013',customer:'คุณวิชัย',services:['ตัดผม','โกนหนวด'],total:130,barberId:'เอ',status:'waiting',date:'20/9/2569',payment:null},
  {id:'A014',customer:'คุณกิตติ',services:['สระผม'],total:40,barberId:null,status:'waiting',date:'20/9/2569',payment:null},
  {id:'A011',customer:'คุณมานี',services:['ตัดผม'],total:80,barberId:'บี',status:'in_service',date:'20/9/2569',payment:null},
  {id:'A010',customer:'คุณประยุทธ',services:['ตัดผม'],total:80,barberId:'เอ',status:'done',date:'20/9/2569',payment:{status:'reported'}},
  {id:'A009',customer:'คุณอนันต์',services:['ตัดผม','สระผม'],total:120,barberId:'เอ',status:'done',date:'20/9/2569',payment:{status:'confirmed',verifiedBy:'เอ'}},
  {id:'A008',customer:'คุณสุดา',services:['โกนหนวด'],total:50,barberId:'บี',status:'done',date:'19/9/2569',payment:{status:'confirmed',verifiedBy:'บี'}},
  {id:'A007',customer:'คุณจิรา',services:['ตัดผม'],total:80,barberId:'บี',status:'cancelled',date:'19/9/2569',payment:null},
  {id:'A006',customer:'คุณทวี',services:['ตัดผม'],total:80,barberId:'เอ',status:'no_show',date:'19/9/2569',payment:null}
];
const REVENUE_7D=[120,340,200,410,300,500,390];
const TODAY='20 กันยายน 2569';

// ---------- Login / Nav ----------
function login(){
  const u=document.getElementById('login-user').value.trim();
  if(!u){ toast('กรุณากรอก Username'); return; }
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('today-date').textContent=TODAY;
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  switchView('overview');
}
function logout(){ document.getElementById('app').style.display='none'; document.getElementById('login-screen').style.display='flex'; }
function switchView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  const titles={overview:"Today's Overview",services:'Service Management',barbers:'Barber Management',accounts:'Staff Account Management',queue:'Queue Management',payments:'Payment Management',history:'Service History',reports:'Reports & Analytics',settings:'Settings'};
  document.getElementById('page-title').textContent=titles[id];
  ({overview:renderOverview,services:renderServices,barbers:renderBarbers,accounts:renderAccounts,
    queue:()=>renderQueue({}),payments:()=>renderPayments('all'),history:renderHistory,
    reports:renderReports,settings:()=>{}})[id]();
}
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
function barberName(id){ const s=STAFF.find(s=>s.id===id); return s?s.name:'ไม่ระบุ'; }

// ---------- Overview ----------
function renderOverview(){
  const today=QUEUE.filter(q=>q.date===TODAY.split(' ')[0]+'/9/2569' || true); // demo: treat all mock rows as "today-ish"
  const waiting=QUEUE.filter(q=>q.status==='waiting').length;
  const inService=QUEUE.filter(q=>q.status==='in_service').length;
  const completed=QUEUE.filter(q=>q.status==='done').length;
  const confirmedRevenue=QUEUE.filter(q=>q.payment&&q.payment.status==='confirmed').reduce((a,q)=>a+q.total,0);
  const pendingPay=QUEUE.filter(q=>q.payment&&q.payment.status!=='confirmed').length;
  document.getElementById('ov-stats').innerHTML=`
    <div class="stat-card"><b>${QUEUE.length}</b><span>Customers Today</span></div>
    <div class="stat-card"><b>${waiting}</b><span>Waiting Queue</span></div>
    <div class="stat-card"><b>${inService}</b><span>In Service</span></div>
    <div class="stat-card"><b>${completed}</b><span>Completed</span></div>
    <div class="stat-card"><b>฿${confirmedRevenue}</b><span>Confirmed Revenue</span></div>
    <div class="stat-card"><b>${pendingPay}</b><span>Pending Payments</span></div>`;
  document.getElementById('ov-barbers').innerHTML=STAFF.filter(s=>s.role==='barber').map(s=>{
    const p=BARBER_PROFILES.find(p=>p.staffId===s.id);
    return `<div class="table-row"><div class="info"><b>${s.name}</b><span>${p.specialty}</span></div><span class="badge ${p.dayOff?'off':'working'}">${p.dayOff?'Off Today':'Working'}</span></div>`;
  }).join('');
  document.getElementById('ov-chairs').innerHTML=CHAIRS.map(c=>
    `<div class="table-row"><div class="info"><b>${c.id}</b></div><span class="badge ${c.status==='cutting'?'in_service':c.status==='resting'?'waiting':'active'}">${c.status.toUpperCase()}</span></div>`).join('');
}

// ---------- Services ----------
function renderServices(){
  document.getElementById('services-table').innerHTML=SERVICES.map(s=>`
    <div class="table-row">
      <div class="info"><b>${s.name} · ฿${s.price}</b><span>${s.desc} · ${s.duration} นาที</span></div>
      <span class="badge ${s.active?'active':'disabled'}">${s.active?'Enabled':'Disabled'}</span>
      <div class="actions">
        <button class="btn small secondary" onclick="openServiceModal('${s.id}')">Edit</button>
        <button class="btn small ${s.active?'danger':''}" onclick="toggleService('${s.id}')">${s.active?'Disable':'Enable'}</button>
      </div>
    </div>`).join('');
}
function toggleService(id){ const s=SERVICES.find(s=>s.id===id); s.active=!s.active; toast((s.active?'เปิด':'ปิด')+'บริการ '+s.name+' แล้ว — ลูกค้าจะเห็นผลทันที'); renderServices(); }
function openServiceModal(id){
  const s=SERVICES.find(s=>s.id===id)||{};
  document.getElementById('modal-content').innerHTML=`
    <h3>${id?'แก้ไขบริการ':'เพิ่มบริการใหม่'}</h3>
    <label>ชื่อบริการ</label><input id="m-name" type="text" value="${s.name||''}">
    <label>ราคา</label><input id="m-price" type="number" value="${s.price||0}">
    <label>ระยะเวลา (นาที)</label><input id="m-dur" type="number" value="${s.duration||15}">
    <label>รายละเอียด</label><input id="m-desc" type="text" value="${s.desc||''}">
    <div class="modal-actions">
      <button class="btn" onclick="saveService('${id||''}')">บันทึก</button>
      <button class="btn secondary" onclick="closeModal()">ยกเลิก</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function saveService(id){
  const data={name:document.getElementById('m-name').value,price:+document.getElementById('m-price').value,
    duration:+document.getElementById('m-dur').value,desc:document.getElementById('m-desc').value};
  if(id){ Object.assign(SERVICES.find(s=>s.id===id),data); }
  else SERVICES.push({id:'svc'+Date.now(),active:true,...data});
  closeModal(); toast('บันทึกข้อมูลสำเร็จ'); renderServices();
}

// ---------- Barbers ----------
function renderBarbers(){
  document.getElementById('barbers-table').innerHTML=STAFF.filter(s=>s.role==='barber').map(s=>{
    const p=BARBER_PROFILES.find(p=>p.staffId===s.id);
    return `<div class="table-row">
      <div class="info"><b>${s.name}</b><span>${p.specialty} · ${p.phone} · ${p.workingDays}</span></div>
      <span class="badge ${p.dayOff?'off':'active'}">${p.dayOff?'Day Off':'Active'}</span>
      <div class="actions">
        <button class="btn small secondary" onclick="openBarberModal('${s.id}')">Edit</button>
        <button class="btn small ${p.dayOff?'':'danger'}" onclick="toggleDayOff('${s.id}')">${p.dayOff?'Set Working':'Set Day Off'}</button>
        <button class="btn small danger" onclick="toggleStaffStatus('${s.id}')">${s.status==='active'?'Disable':'Enable'}</button>
      </div>
    </div>`;
  }).join('');
}
function toggleDayOff(id){ const p=BARBER_PROFILES.find(p=>p.staffId===id); p.dayOff=!p.dayOff; toast('อัปเดตสถานะแล้ว — ถ้าหยุดวันนี้จะไม่แสดงในฝั่งลูกค้า'); renderBarbers(); }
function toggleStaffStatus(id){ const s=STAFF.find(s=>s.id===id); s.status=s.status==='active'?'disabled':'active'; renderBarbers(); renderAccounts(); }
function openBarberModal(id){
  const s=STAFF.find(s=>s.id===id)||{}; const p=BARBER_PROFILES.find(p=>p.staffId===id)||{};
  document.getElementById('modal-content').innerHTML=`
    <h3>${id?'แก้ไขข้อมูลช่าง':'เพิ่มช่างใหม่'}</h3>
    <label>ชื่อช่าง</label><input id="m-name" type="text" value="${s.name||''}">
    <label>เบอร์โทร</label><input id="m-phone" type="text" value="${p.phone||''}">
    <label>ความถนัด</label><input id="m-spec" type="text" value="${p.specialty||''}">
    <label>วันทำงาน</label><input id="m-days" type="text" value="${p.workingDays||'จ-ส'}">
    <div class="modal-actions">
      <button class="btn" onclick="saveBarber('${id||''}')">บันทึก</button>
      <button class="btn secondary" onclick="closeModal()">ยกเลิก</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function saveBarber(id){
  const name=document.getElementById('m-name').value, phone=document.getElementById('m-phone').value,
    spec=document.getElementById('m-spec').value, days=document.getElementById('m-days').value;
  if(id){ STAFF.find(s=>s.id===id).name=name; Object.assign(BARBER_PROFILES.find(p=>p.staffId===id),{phone,specialty:spec,workingDays:days}); }
  else{ const newId='b'+Date.now(); STAFF.push({id:newId,username:'staff_'+newId,name,role:'barber',status:'active',lastLogin:'-'});
    BARBER_PROFILES.push({staffId:newId,specialty:spec,phone,workingDays:days,dayOff:false}); }
  closeModal(); toast('บันทึกข้อมูลสำเร็จ'); renderBarbers();
}

// ---------- Staff Accounts ----------
function renderAccounts(){
  document.getElementById('accounts-table').innerHTML=STAFF.map(s=>`
    <div class="table-row">
      <div class="info"><b>${s.username} · ${s.name}</b><span>${s.role} · Last login ${s.lastLogin}</span></div>
      <span class="badge ${s.status==='active'?'active':'disabled'}">${s.status==='active'?'Active':'Disabled'}</span>
      <div class="actions">
        <button class="btn small secondary" onclick="resetPassword('${s.id}')">Reset Password</button>
        <button class="btn small danger" onclick="toggleStaffStatus('${s.id}')">${s.status==='active'?'Disable':'Enable'}</button>
      </div>
    </div>`).join('');
}
function resetPassword(id){ toast('รีเซ็ตรหัสผ่านของ '+barberName(id)+' แล้ว (ส่งรหัสใหม่ให้พนักงาน)'); }
function createAccount(){
  document.getElementById('modal-content').innerHTML=`
    <h3>สร้างบัญชีพนักงานใหม่</h3>
    <label>Username</label><input id="m-user" type="text">
    <label>ชื่อพนักงาน</label><input id="m-name" type="text">
    <label>Role</label><select id="m-role"><option value="barber">barber</option><option value="admin">admin</option></select>
    <div class="modal-actions">
      <button class="btn" onclick="saveAccount()">สร้างบัญชี</button>
      <button class="btn secondary" onclick="closeModal()">ยกเลิก</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function saveAccount(){
  const username=document.getElementById('m-user').value, name=document.getElementById('m-name').value, role=document.getElementById('m-role').value;
  const id='u'+Date.now();
  STAFF.push({id,username,name,role,status:'active',lastLogin:'-'});
  if(role==='barber') BARBER_PROFILES.push({staffId:id,specialty:'-',phone:'-',workingDays:'จ-ส',dayOff:false});
  closeModal(); toast('สร้างบัญชีสำเร็จ'); renderAccounts();
}

// ---------- Queue Management (with overrides) ----------
function renderQueue(f){
  const filters=f||{};
  document.getElementById('queue-filters').innerHTML=`
    <select id="qf-barber" onchange="applyQueueFilter()"><option value="">ทุกช่าง</option>${STAFF.filter(s=>s.role==='barber').map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
    <select id="qf-status" onchange="applyQueueFilter()"><option value="">ทุกสถานะ</option>${['waiting','in_service','done','cancelled','no_show'].map(s=>`<option value="${s}">${s}</option>`).join('')}</select>`;
  let rows=QUEUE;
  if(filters.barber) rows=rows.filter(q=>q.barberId===filters.barber);
  if(filters.status) rows=rows.filter(q=>q.status===filters.status);
  document.getElementById('queue-table').innerHTML=rows.length?rows.map(q=>`
    <div class="table-row">
      <div class="info"><b>${q.id} · ${q.customer}</b><span>${q.services.join(', ')} · ${barberName(q.barberId)} · ฿${q.total} · ${q.date}</span></div>
      <span class="badge ${q.status}">${q.status.toUpperCase()}</span>
      <div class="actions">
        ${q.barberId===null&&q.status==='waiting'?`<button class="btn small secondary" onclick="assignBarber('${q.id}')">Assign Barber</button>`:''}
        ${(q.status==='waiting'||q.status==='in_service')?`<button class="btn small secondary" onclick="moveQueue('${q.id}')">Move Queue</button>
        <button class="btn small danger" onclick="forceCancel('${q.id}')">Cancel</button>`:''}
      </div>
    </div>`).join(''):'<div class="empty">ไม่มีรายการตามเงื่อนไข</div>';
}
function applyQueueFilter(){ renderQueue({barber:document.getElementById('qf-barber').value,status:document.getElementById('qf-status').value}); }
function assignBarber(id){ openMoveModal(id,'มอบหมายช่างให้คิว'); }
function moveQueue(id){ openMoveModal(id,'ย้ายคิวไปช่างอื่น'); }
function openMoveModal(id,title){
  const options=STAFF.filter(s=>s.role==='barber').map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('modal-content').innerHTML=`
    <h3>${title} — ${id}</h3><label>เลือกช่าง</label><select id="m-newbarber">${options}</select>
    <div class="modal-actions">
      <button class="btn danger" onclick="confirmMove('${id}')">ยืนยันการเปลี่ยนแปลง</button>
      <button class="btn secondary" onclick="closeModal()">ยกเลิก</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function confirmMove(id){
  const newB=document.getElementById('m-newbarber').value;
  const q=QUEUE.find(q=>q.id===id); const oldB=q.barberId; q.barberId=newB;
  closeModal(); toast(`ย้ายคิว ${id} ${oldB?'จาก '+barberName(oldB):''} ไป ${barberName(newB)} แล้ว`); renderQueue({});
}
function forceCancel(id){
  showModal('ยืนยันการยกเลิกคิว','คุณต้องการบังคับยกเลิกคิว '+id+' ใช่หรือไม่?',[
    {label:'ยืนยัน',cls:'danger',fn:()=>{ QUEUE.find(q=>q.id===id).status='cancelled'; closeModal(); toast('ยกเลิกคิว '+id+' แล้ว'); renderQueue({}); }},
    {label:'ยกเลิก',cls:'secondary',fn:closeModal}
  ]);
}

// ---------- Payments ----------
function renderPayments(filter){
  document.getElementById('pay-filters').innerHTML=['all','pending','reported','confirmed'].map(f=>
    `<button class="${filter===f?'on':''}" onclick="renderPayments('${f}')">${f==='all'?'ทั้งหมด':f}</button>`).join('');
  let rows=QUEUE.filter(q=>q.payment);
  if(filter!=='all') rows=rows.filter(q=>q.payment.status===filter);
  document.getElementById('payments-table').innerHTML=rows.length?rows.map(q=>`
    <div class="table-row">
      <div class="info"><b>${q.id} · ${q.customer}</b><span>฿${q.total} · ${q.date} · ${barberName(q.barberId)}${q.payment.verifiedBy?' · Verified by '+barberName(q.payment.verifiedBy):''}</span></div>
      <span class="badge ${q.payment.status}">${q.payment.status==='reported'?'Customer Reported':q.payment.status}</span>
      ${q.payment.status!=='confirmed'?`<button class="btn small" onclick="adminConfirmPayment('${q.id}')">ยืนยันการชำระเงิน</button>`:''}
    </div>`).join(''):'<div class="empty">ไม่มีรายการ</div>';
}
function adminConfirmPayment(id){
  showModal('ยืนยันการชำระเงิน','ยืนยันว่าได้รับเงินสำหรับคิว '+id+' แล้วใช่หรือไม่?',[
    {label:'ยืนยัน',cls:'',fn:()=>{ QUEUE.find(q=>q.id===id).payment={status:'confirmed',verifiedBy:'owner'}; closeModal(); toast('ยืนยันการชำระเงินแล้ว'); renderPayments('all'); }},
    {label:'ยกเลิก',cls:'secondary',fn:closeModal}
  ]);
}

// ---------- History ----------
function renderHistory(){
  const rows=QUEUE.filter(q=>q.status==='done'||q.status==='cancelled'||q.status==='no_show');
  document.getElementById('history-table').innerHTML=rows.map(q=>`
    <div class="table-row"><div class="info"><b>${q.id} · ${q.customer}</b><span>${q.services.join(', ')} · ${barberName(q.barberId)} · ${q.date}</span></div>
    <span class="badge ${q.status}">${q.status.toUpperCase()}</span><div class="info"><b>฿${q.total}</b></div></div>`).join('');
}

// ---------- Reports ----------
function renderReports(){
  const done=QUEUE.filter(q=>q.status==='done');
  const confirmed=QUEUE.filter(q=>q.payment&&q.payment.status==='confirmed');
  const totalRevenue=confirmed.reduce((a,q)=>a+q.total,0);
  const customers=new Set(QUEUE.map(q=>q.customer)).size;
  const noShow=QUEUE.filter(q=>q.status==='no_show').length;
  const cancelled=QUEUE.filter(q=>q.status==='cancelled').length;
  document.getElementById('report-stats').innerHTML=`
    <div class="stat-card"><b>฿${totalRevenue}</b><span>Total Revenue</span></div>
    <div class="stat-card"><b>${customers}</b><span>Customers</span></div>
    <div class="stat-card"><b>${done.length}</b><span>Completed</span></div>
    <div class="stat-card"><b>${noShow}</b><span>No-show</span></div>
    <div class="stat-card"><b>${cancelled}</b><span>Cancelled Queue</span></div>`;

  const byBarber={};
  confirmed.forEach(q=>{ byBarber[q.barberId]=(byBarber[q.barberId]||0)+q.total; });
  const maxB=Math.max(1,...Object.values(byBarber));
  document.getElementById('chart-barber').innerHTML=Object.entries(byBarber).map(([id,val])=>
    `<div class="bar-row"><span class="label">${barberName(id)}</span><div class="bar-track"><div class="bar-fill" style="width:${val/maxB*100}%"></div></div><span class="value">฿${val}</span></div>`).join('')||'<div class="empty">ยังไม่มีข้อมูล</div>';

  const byService={};
  confirmed.forEach(q=>q.services.forEach(name=>{ const svc=SERVICES.find(s=>s.name===name); byService[name]=(byService[name]||0)+(svc?svc.price:0); }));
  const maxS=Math.max(1,...Object.values(byService));
  document.getElementById('chart-service').innerHTML=Object.entries(byService).map(([name,val])=>
    `<div class="bar-row"><span class="label">${name}</span><div class="bar-track"><div class="bar-fill" style="width:${val/maxS*100}%"></div></div><span class="value">฿${val}</span></div>`).join('')||'<div class="empty">ยังไม่มีข้อมูล</div>';

  const maxL=Math.max(...REVENUE_7D), pts=REVENUE_7D.map((v,i)=>`${i*50},${80-(v/maxL*70)}`).join(' ');
  document.getElementById('chart-line').innerHTML=`<svg viewBox="0 0 300 90" width="100%" height="90">
    <polyline points="${pts}" fill="none" stroke="#C6A15B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;

  const statusCounts={waiting:0,in_service:0,done:0,cancelled:0,no_show:0};
  QUEUE.forEach(q=>statusCounts[q.status]++);
  const colors={waiting:'#C6A15B',in_service:'#8ec3f0',done:'#8fd18f',cancelled:'#8C857A',no_show:'#e08c8c'};
  const total=QUEUE.length; let acc=0;
  const stops=Object.entries(statusCounts).map(([k,v])=>{ const start=acc/total*360; acc+=v; const end=acc/total*360; return `${colors[k]} ${start}deg ${end}deg`; }).join(',');
  document.getElementById('chart-donut').innerHTML=`<div class="donut-wrap">
    <div class="donut" style="background:conic-gradient(${stops})"></div>
    <div class="donut-legend">${Object.entries(statusCounts).map(([k,v])=>`<div><span style="background:${colors[k]}"></span>${k} (${v})</div>`).join('')}</div>
  </div>`;
}

// ---------- Modal helpers ----------
function showModal(title,desc,buttons){
  document.getElementById('modal-content').innerHTML=`<h3>${title}</h3><p>${desc}</p><div class="modal-actions">${buttons.map((b,i)=>`<button class="btn ${b.cls}" id="modal-btn-${i}">${b.label}</button>`).join('')}</div>`;
  buttons.forEach((b,i)=>document.getElementById('modal-btn-'+i).onclick=b.fn);
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); }

