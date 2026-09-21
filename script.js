// ---------- Demo data (in a real system this comes from Admin/Staff via Firebase) ----------
const SERVICES=[
  {id:'cut',name:'ตัดผม',price:80,duration:30,desc:'ทรงคลาสสิก',available:true},
  {id:'shave',name:'โกนหนวด',price:50,duration:15,desc:'โกนด้วยมีดโกน',available:true},
  {id:'wash',name:'สระผม',price:40,duration:15,desc:'สระ+นวดหนังศีรษะ',available:true},
  {id:'color',name:'ทำสีผม',price:250,duration:60,desc:'ปิดโดยแอดมิน',available:false}
];
const BARBERS=[
  {id:'เอ',name:'ช่างเอ',specialty:'ทรงคลาสสิก',working:true,dayOff:false,queueCount:4},
  {id:'บี',name:'ช่างบี',specialty:'เทรนด์เกาหลี',working:true,dayOff:false,queueCount:1},
  {id:'ซี',name:'ช่างซี',specialty:'เคราและหนวด',working:true,dayOff:true,queueCount:0} // dayOff:true → ต้องไม่แสดงให้ลูกค้าเลือก
];
const CHAIR_POOL=['เก้าอี้ 1','เก้าอี้ 2','เก้าอี้ 3'];
const AVG_MIN_PER_QUEUE=15;
let queueCounter=15;

// ---------- State ----------
let state={
  selected:[], barberId:undefined, phone:'', name:'',
  queueStatus:'idle', // idle | waiting | in_service | done | cancelled
  queueNumber:null, chair:null, startTime:null, bookedAt:null,
  history:[]
};

// ---------- Nav / menu ----------
function toggleMenu(){ document.getElementById('menu-panel').classList.toggle('open'); }
function closeMenuAndShow(id){ document.getElementById('menu-panel').classList.remove('open'); showScreen(id); }

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='home') renderHome();
  if(id==='services') renderServices();
  if(id==='barber') renderBarberList();
  if(id==='queue') renderQueueScreen();
  if(id==='history') renderHistory();
}

function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

// ---------- Duplicate Queue Validation ----------
function hasActiveQueue(){ return state.queueStatus==='waiting' || state.queueStatus==='in_service'; }
function attemptBooking(){
  document.getElementById('menu-panel').classList.remove('open');
  if(hasActiveQueue()){ document.getElementById('dup-modal').classList.add('open'); return; }
  showScreen('services');
}
function hideDupModal(){ document.getElementById('dup-modal').classList.remove('open'); }

// ---------- Home ----------
function renderHome(){
  const working=BARBERS.filter(b=>b.working && !b.dayOff);
  document.getElementById('home-stats').innerHTML=`
    <div class="stat"><b>${working.length}</b><span>ช่างกำลังให้บริการ</span></div>
    <div class="stat"><b>${working.reduce((a,b)=>a+b.queueCount,0)}</b><span>คิวที่กำลังรอ</span></div>
    <div class="stat"><b>1</b><span>เก้าอี้ว่าง</span></div>`;
  document.getElementById('home-barbers').innerHTML=working.map(b=>`
    <div class="card"><div class="info"><b><span class="status-dot on"></span>${b.name}</b><span>${b.specialty} · ${b.queueCount} คิวรอ</span></div></div>
  `).join('');
}

// ---------- Services (with loading + error demo states) ----------
function renderServices(){
  const list=document.getElementById('svc-list');
  list.innerHTML=`<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
  setTimeout(()=>{
    list.innerHTML='';
    SERVICES.forEach(s=>{
      const picked=state.selected.includes(s.id);
      const el=document.createElement('div');
      el.className='card'+(s.available?'':' disabled');
      el.innerHTML=`<div class="info"><b>${s.name}</b><span>${s.desc} · ${s.duration} นาที · ${s.available?'พร้อมให้บริการ':'ปิดให้บริการ'}</span></div><div class="price">฿${s.price}</div><div class="select-box ${picked?'checked':''}"></div>`;
      if(s.available) el.onclick=()=>toggleService(s.id);
      list.appendChild(el);
    });
    updateSvcSummary();
  },400);
}
function showServiceError(){
  document.getElementById('svc-list').innerHTML=`<div class="error-box"><p>ไม่สามารถโหลดข้อมูลบริการได้</p><button class="btn secondary" onclick="renderServices()">ลองใหม่</button></div>`;
}
function toggleService(id){
  const i=state.selected.indexOf(id);
  if(i>-1) state.selected.splice(i,1); else state.selected.push(id);
  renderServices();
}
function updateSvcSummary(){
  const chosen=SERVICES.filter(s=>state.selected.includes(s.id));
  const total=chosen.reduce((a,s)=>a+s.price,0);
  document.getElementById('svc-summary').style.display=chosen.length?'block':'none';
  document.getElementById('svc-lines').innerHTML=chosen.map(s=>`<div class="line"><span>${s.name}</span><span>฿${s.price}</span></div>`).join('');
  document.getElementById('svc-total').textContent='฿'+total;
  document.getElementById('svc-next').disabled=chosen.length===0;
}

// ---------- Barber selection ----------
function renderBarberList(){
  // Business rule: ช่างที่หยุดวันนี้ (dayOff) ต้องไม่ปรากฏในรายการเลือก
  document.getElementById('barber-list').innerHTML=BARBERS.filter(b=>!b.dayOff).map(b=>`
    <div class="card" onclick="pickBarber('${b.id}')">
      <div class="info"><b>${b.name}</b><span>${b.specialty} · <span class="status-dot on"></span>กำลังทำงาน · ${b.queueCount} คิวรอ</span></div>
      <div class="select-box" id="b-${b.id}"></div>
    </div>`).join('');
}
function pickBarber(id){
  state.barberId=id;
  document.querySelectorAll('#barber .select-box').forEach(b=>b.classList.remove('checked'));
  document.getElementById(id?'b-'+id:'b-none').classList.add('checked');
  document.getElementById('barber-next').disabled=false;
}
function getSelectedBarber(){ return BARBERS.find(b=>b.id===state.barberId) || null; }
function currentQueueCount(){
  const b=getSelectedBarber();
  if(b) return b.queueCount;
  return BARBERS.filter(b=>b.working && !b.dayOff).reduce((a,b)=>a+b.queueCount,0);
}

// ---------- Identification ----------
function checkPhone(){
  const phone=document.getElementById('phone-input').value.trim();
  state.phone=phone;
  const nameBlock=document.getElementById('name-block');
  const nameLabel=document.getElementById('name-label');
  const nameInput=document.getElementById('name-input');
  nameBlock.style.display='block';
  if(phone==='0812345678'){
    nameLabel.textContent='พบข้อมูลลูกค้าเดิม';
    nameInput.value='คุณสมชาย'; nameInput.disabled=true;
  } else {
    nameLabel.textContent='ลูกค้าใหม่ — กรอกชื่อของคุณ';
    nameInput.value=''; nameInput.disabled=false;
  }
  showBookingSummary();
}
function showBookingSummary(){
  const chosen=SERVICES.filter(s=>state.selected.includes(s.id));
  const total=chosen.reduce((a,s)=>a+s.price,0);
  document.getElementById('c-services').textContent=chosen.map(s=>s.name).join(', ');
  document.getElementById('c-barber').textContent=getSelectedBarber()?getSelectedBarber().name:'ไม่ระบุช่าง';
  document.getElementById('c-queuecount').textContent=currentQueueCount()+' คิว';
  document.getElementById('c-total').textContent='฿'+total;
  document.getElementById('confirm-summary').style.display='block';
  document.getElementById('confirm-btn').style.display='block';
}

// ---------- Booking / Queue ----------
function confirmBooking(){
  state.name=document.getElementById('name-input').value||'ลูกค้า';
  state.queueStatus='waiting';
  state.queueNumber='A0'+(queueCounter++);
  state.chair=null; state.startTime=null;
  state.bookedAt=new Date();
  toast('จองคิวสำเร็จ');
  showScreen('queue');
}

function renderQueueScreen(){
  const el=document.getElementById('queue-content');
  el.innerHTML=`<div class="skeleton"></div><div class="skeleton"></div>`;
  setTimeout(()=>{
    if(state.queueStatus==='idle' || state.queueStatus==='cancelled'){
      el.innerHTML=`<div class="empty">คุณไม่มีคิวที่กำลังใช้งานอยู่</div><button class="btn block" onclick="attemptBooking()">จองคิวเลย</button>`;
      return;
    }
    const before=currentQueueCount();
    const eta=before*AVG_MIN_PER_QUEUE;
    const serviceNames=SERVICES.filter(s=>state.selected.includes(s.id)).map(s=>s.name).join(', ');
    const barberName=getSelectedBarber()?getSelectedBarber().name:'ไม่ระบุ (ระบบจัดให้)';

    if(state.queueStatus==='waiting'){
      el.innerHTML=`
        <div class="status-pill">กำลังรอคิว</div>
        <div class="queue-number">${state.queueNumber}</div>
        <div class="summary">
          <div class="line"><span>คิวก่อนหน้าคุณ</span><span>${before} คิว</span></div>
          <div class="line"><span>เวลารอโดยประมาณ</span><span>${eta} นาที</span></div>
          <div class="line"><span>ช่าง</span><span>${barberName}</span></div>
          <div class="line"><span>บริการ</span><span>${serviceNames}</span></div>
        </div>
        <button class="btn secondary block" onclick="cancelQueue()">ยกเลิกคิว</button>
        <div class="demo-box">
          <p>ปุ่มจำลองฝั่งช่าง (สำหรับสาธิตการอัปเดตแบบ real-time)</p>
          <button class="btn secondary" onclick="simulateStart()">จำลอง: ช่างเริ่มบริการ</button>
        </div>`;
    } else if(state.queueStatus==='in_service'){
      el.innerHTML=`
        <div class="status-pill" style="background:#1f3a24;color:#8fd18f">กำลังรับบริการ</div>
        <div class="queue-number">${state.queueNumber}</div>
        <div class="summary">
          <div class="line"><span>ช่าง</span><span>${barberName}</span></div>
          <div class="line"><span>เก้าอี้</span><span>${state.chair}</span></div>
          <div class="line"><span>บริการ</span><span>${serviceNames}</span></div>
          <div class="line"><span>เวลาเริ่ม</span><span>${state.startTime.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</span></div>
        </div>
        <div class="demo-box">
          <p>ปุ่มจำลองฝั่งช่าง</p>
          <button class="btn secondary" onclick="simulateEnd()">จำลอง: ช่างจบบริการ</button>
        </div>`;
    }
  },350);
}

function cancelQueue(){
  // อนุญาตเฉพาะตอน waiting เท่านั้น (ปุ่มนี้แสดงเฉพาะตอน waiting อยู่แล้ว)
  state.queueStatus='cancelled';
  toast('ยกเลิกคิวเรียบร้อยแล้ว');
  resetAndGoHome();
}
function simulateStart(){
  if(state.queueStatus!=='waiting') return;
  state.queueStatus='in_service';
  state.chair=CHAIR_POOL[Math.floor(Math.random()*CHAIR_POOL.length)];
  state.startTime=new Date();
  renderQueueScreen();
}
function simulateEnd(){
  if(state.queueStatus!=='in_service') return;
  state.queueStatus='done';
  const chosen=SERVICES.filter(s=>state.selected.includes(s.id));
  const total=chosen.reduce((a,s)=>a+s.price,0);
  document.getElementById('p-queue').textContent=state.queueNumber;
  document.getElementById('p-barber').textContent=getSelectedBarber()?getSelectedBarber().name:'ไม่ระบุ';
  document.getElementById('p-services').textContent=chosen.map(s=>s.name).join(', ');
  document.getElementById('p-total').textContent='฿'+total;
  document.getElementById('pay-pending').style.display='block';
  document.getElementById('pay-success').style.display='none';
  document.getElementById('pay-note').style.display='none';
  document.getElementById('staff-confirm-box').style.display='none';
  showScreen('payment');
}

// ---------- Payment ----------
function reportPayment(){
  document.getElementById('pay-note').style.display='block';
  document.getElementById('staff-confirm-box').style.display='block';
}
function simulateConfirmPayment(){
  const chosen=SERVICES.filter(s=>state.selected.includes(s.id));
  const total=chosen.reduce((a,s)=>a+s.price,0);
  const now=new Date();
  const barberName=getSelectedBarber()?getSelectedBarber().name:'ไม่ระบุ';
  state.history.unshift({
    queue:state.queueNumber, barber:barberName, services:chosen.map(s=>s.name).join(', '),
    total, date:now.toLocaleDateString('th-TH'), time:now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}),
    paymentStatus:'confirmed'
  });
  document.getElementById('s-queue').textContent=state.queueNumber;
  document.getElementById('s-barber').textContent=barberName;
  document.getElementById('s-services').textContent=chosen.map(s=>s.name).join(', ');
  document.getElementById('s-datetime').textContent=now.toLocaleDateString('th-TH')+' '+now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('s-total').textContent='฿'+total;
  document.getElementById('pay-pending').style.display='none';
  document.getElementById('pay-success').style.display='block';
}

// ---------- History ----------
function renderHistory(){
  const el=document.getElementById('history-list');
  if(!state.history.length){ el.innerHTML='<div class="empty">ยังไม่มีประวัติการใช้บริการ</div>'; return; }
  el.innerHTML=state.history.map(h=>`
    <div class="card"><div class="info"><b>${h.queue} · ${h.services}</b><span>${h.date} ${h.time} · ${h.barber} · ${h.paymentStatus==='confirmed'?'ชำระเงินแล้ว':'รอตรวจสอบ'}</span></div><div class="price">฿${h.total}</div></div>
  `).join('');
}

// ---------- Reset ----------
function resetAndGoHome(){
  state={selected:[],barberId:undefined,phone:'',name:'',queueStatus:'idle',queueNumber:null,chair:null,startTime:null,bookedAt:null,history:state.history};
  showScreen('home');
}

// ---------- Init ----------
renderHome();
