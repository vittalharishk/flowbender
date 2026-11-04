const fs = require('fs');
const filePath = 'F:/movie project/flowbender/data/flowbender-demo-data.json';
const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const d = raw.data;
const now = new Date().toISOString();

// ─── Film Locations ───────────────────────────────────────────────────────────

if (!d.filmLocations || d.filmLocations.length === 0) {
  d.filmLocations = [
    { id:'f-loc1', name:'Ramoji Film City — Main Studio', category:'studio', address:'Ramoji Film City, Abdullapurmet', city:'Hyderabad', state:'Telangana', contactPerson:'Venue Manager', contactPhone:'9849200001', locationOwner:'Ramoji Rao', locationManager:'Venkat Reddy', permissionStatus:'approved', ratePerDay:500000, deposit:1500000, accessTimings:'6 AM – 10 PM', parking:'250+ vehicles', facilities:'Full studio, sets, equipment, catering', restrictions:'No open fire', notes:'', status:'available', createdAt:now },
    { id:'f-loc2', name:'Annapurna Studios Stage 3', category:'studio', address:'Annapurna Studios, Jubilee Hills', city:'Hyderabad', state:'Telangana', contactPerson:'Studio Manager', contactPhone:'9849200002', locationOwner:'Nagarjuna', locationManager:'Rajesh Kumar', permissionStatus:'approved', ratePerDay:200000, deposit:400000, accessTimings:'7 AM – 9 PM', parking:'100 vehicles', facilities:'AC stage, lighting grid, green room', restrictions:'No structural changes', notes:'', status:'available', createdAt:now },
    { id:'f-loc3', name:'Charminar East Gate', category:'outdoor', address:'Charminar, Old City', city:'Hyderabad', state:'Telangana', contactPerson:'ASI Officer', contactPhone:'9849200003', locationOwner:'Archaeological Survey of India', locationManager:'Mohammed Aziz', permissionStatus:'approved', ratePerDay:150000, deposit:300000, accessTimings:'Before 8 AM only', parking:'50 vehicles (nearby)', facilities:'Heritage exterior, open space', restrictions:'No vehicles on monument premises', notes:'Permission valid for 2024–2025', status:'available', createdAt:now },
    { id:'f-loc4', name:'Hussain Sagar Lakeside', category:'outdoor', address:'Tank Bund, Hussain Sagar', city:'Hyderabad', state:'Telangana', contactPerson:'HMDA Officer', contactPhone:'9849200004', locationOwner:'HMDA', locationManager:'Srinivasa Rao', permissionStatus:'approved', ratePerDay:80000, deposit:160000, accessTimings:'5 AM – 8 PM', parking:'200 vehicles', facilities:'Open lakefront, walking path, boat access', restrictions:'No drones without permission', notes:'', status:'available', createdAt:now },
    { id:'f-loc5', name:'Golconda Fort', category:'outdoor', address:'Golconda, Ibrahim Bagh', city:'Hyderabad', state:'Telangana', contactPerson:'Fort Curator', contactPhone:'9849200005', locationOwner:'Archaeological Survey of India', locationManager:'Ramaiah', permissionStatus:'approved', ratePerDay:200000, deposit:500000, accessTimings:'6 AM – 7 PM', parking:'100 vehicles (outside)', facilities:'Historic fort, ramparts, open grounds', restrictions:'No vehicle entry inside fort', notes:'', status:'booked', createdAt:now },
    { id:'f-loc6', name:'Salar Jung Museum — Interior', category:'indoor', address:'Salar Jung Road, Dar-ul-Shifa', city:'Hyderabad', state:'Telangana', contactPerson:'Museum Director', contactPhone:'9849200006', locationOwner:'Government of India', locationManager:'Dr. Fatima Begum', permissionStatus:'under-review', ratePerDay:300000, deposit:600000, accessTimings:'Night shoots only', parking:'80 vehicles', facilities:'Museum halls, artifacts, chandeliers', restrictions:'No physical contact with exhibits', notes:'Application pending', status:'unavailable', createdAt:now },
    { id:'f-loc7', name:'Necklace Road Stretch', category:'road-public', address:'Necklace Road, Sanjeeva Reddy Nagar', city:'Hyderabad', state:'Telangana', contactPerson:'GHMC Officer', contactPhone:'9849200007', locationOwner:'GHMC', locationManager:'Traffic Officer', permissionStatus:'approved', ratePerDay:50000, deposit:0, accessTimings:'12 AM – 5 AM (night blocks)', parking:'On-site parking available', facilities:'2km stretch, lakeside road', restrictions:'Night shoots only to avoid traffic', notes:'', status:'available', createdAt:now },
    { id:'f-loc8', name:'Rishikonda Beach', category:'outdoor', address:'Beach Road, Rushikonda', city:'Visakhapatnam', state:'Andhra Pradesh', contactPerson:'Beach Authority', contactPhone:'9849200008', locationOwner:'AP Tourism', locationManager:'Suresh Babu', permissionStatus:'approved', ratePerDay:60000, deposit:120000, accessTimings:'5 AM – 8 PM', parking:'150 vehicles', facilities:'Beach, sand, waves, cliffs nearby', restrictions:'No vehicle on beach without approval', notes:'', status:'available', createdAt:now },
    { id:'f-loc9', name:'Infosys Campus — Exterior', category:'commercial', address:'Infosys Ltd, Hitech City', city:'Hyderabad', state:'Telangana', contactPerson:'Corporate Relations', contactPhone:'9849200009', locationOwner:'Infosys Ltd', locationManager:'Priya Nambiar', permissionStatus:'approved', ratePerDay:100000, deposit:200000, accessTimings:'Weekends only', parking:'500 vehicles', facilities:'Modern campus, glass buildings, landscapes', restrictions:'No filming of employee areas', notes:'', status:'available', createdAt:now },
    { id:'f-loc10', name:'Lambasingi Hillside', category:'outdoor', address:'Lambasingi Village, Chintapalli', city:'Visakhapatnam', state:'Andhra Pradesh', contactPerson:'Village Sarpanch', contactPhone:'9849200010', locationOwner:'Village Panchayat', locationManager:'Raju Naidu', permissionStatus:'approved', ratePerDay:40000, deposit:50000, accessTimings:'All day', parking:'30 vehicles', facilities:'Misty hills, forest, valley views', restrictions:'Eco-sensitive zone — no generators', notes:'', status:'available', createdAt:now },
    { id:'f-loc11', name:'Qutb Shahi Tombs', category:'outdoor', address:'Ibrahim Bagh, Golconda', city:'Hyderabad', state:'Telangana', contactPerson:'ASI Officer', contactPhone:'9849200011', locationOwner:'Archaeological Survey of India', locationManager:'Azharuddin', permissionStatus:'requested', ratePerDay:100000, deposit:200000, accessTimings:'Before 8 AM', parking:'50 vehicles', facilities:'Historic tombs, open grounds', restrictions:'No lighting rigs on monument', notes:'Application submitted Feb 2026', status:'unavailable', createdAt:now },
    { id:'f-loc12', name:'Pattiseema Village', category:'village-rural', address:'Pattiseema, West Godavari', city:'West Godavari', state:'Andhra Pradesh', contactPerson:'Village Head', contactPhone:'9849200012', locationOwner:'Village Panchayat', locationManager:'Venkata Ramana', permissionStatus:'approved', ratePerDay:25000, deposit:25000, accessTimings:'All day', parking:'20 vehicles', facilities:'Paddy fields, river, thatched houses', restrictions:'Minimal crew', notes:'', status:'available', createdAt:now },
    { id:'f-loc13', name:'Sri City Industrial Campus', category:'commercial', address:'Sri City, Tada', city:'Nellore', state:'Andhra Pradesh', contactPerson:'Admin Manager', contactPhone:'9849200013', locationOwner:'Sri City Pvt Ltd', locationManager:'Kiran Reddy', permissionStatus:'under-review', ratePerDay:150000, deposit:300000, accessTimings:'Weekends and holidays', parking:'400 vehicles', facilities:'Modern industrial campus, wide roads, warehouses', restrictions:'NDA required', notes:'', status:'unavailable', createdAt:now },
    { id:'f-loc14', name:'Film Nagar Residential Bungalow', category:'residential', address:'Plot 72, Film Nagar', city:'Hyderabad', state:'Telangana', contactPerson:'Property Owner', contactPhone:'9849200014', locationOwner:'Ravi Shankar', locationManager:'Ravi Shankar', permissionStatus:'approved', ratePerDay:75000, deposit:150000, accessTimings:'All day', parking:'15 vehicles', facilities:'3-floor bungalow, garden, swimming pool', restrictions:'No external lighting on neighbours', notes:'', status:'available', createdAt:now },
    { id:'f-loc15', name:'KBR National Park', category:'outdoor', address:'KBR Park, Jubilee Hills', city:'Hyderabad', state:'Telangana', contactPerson:'Park Manager', contactPhone:'9849200015', locationOwner:'Telangana Forest Dept', locationManager:'Forest Officer', permissionStatus:'approved', ratePerDay:30000, deposit:30000, accessTimings:'6 AM – 6 PM', parking:'100 vehicles', facilities:'Forest paths, lake, nature', restrictions:'No vehicles inside park', notes:'', status:'available', createdAt:now },
    { id:'f-loc16', name:'Underwater Set — Tank Studio', category:'film-set', address:'Ramoji Film City, Tech Zone', city:'Hyderabad', state:'Telangana', contactPerson:'Set Manager', contactPhone:'9849200016', locationOwner:'Ramoji Film City', locationManager:'Tank In-charge', permissionStatus:'approved', ratePerDay:800000, deposit:2000000, accessTimings:'8 AM – 8 PM', parking:'50 vehicles', facilities:'20,000L underwater tank, lighting rigs, safety divers', restrictions:'Certified divers only', notes:'Used for Devara underwater sequences', status:'available', createdAt:now },
    { id:'f-loc17', name:'Nagarjuna Sagar Dam Viewpoint', category:'outdoor', address:'Nagarjuna Sagar Dam, Nalgonda', city:'Nalgonda', state:'Telangana', contactPerson:'Dam Authority', contactPhone:'9849200017', locationOwner:'APGENCO', locationManager:'Dam Superintendent', permissionStatus:'requested', ratePerDay:200000, deposit:300000, accessTimings:'5 AM – 7 PM', parking:'100 vehicles', facilities:'Dam face, reservoir, scenic viewpoints', restrictions:'Security clearance required', notes:'Application in process', status:'unavailable', createdAt:now },
    { id:'f-loc18', name:'Heritage Haveli — Old City', category:'residential', address:'Nampally Estate Road, Nampally', city:'Hyderabad', state:'Telangana', contactPerson:'Haveli Owner', contactPhone:'9849200018', locationOwner:'Nawab Family Trust', locationManager:'Salim Khan', permissionStatus:'approved', ratePerDay:120000, deposit:240000, accessTimings:'All day', parking:'30 vehicles', facilities:'Courtyard, antique interiors, traditional architecture', restrictions:'No structural alterations', notes:'', status:'available', createdAt:now },
  ];
  console.log('Seeded filmLocations:', d.filmLocations.length);
}

// ─── Location Scouting ────────────────────────────────────────────────────────

if (!d.locationScouting || d.locationScouting.length === 0) {
  d.locationScouting = [
    { id:'sc1', projectId:'p4', locationId:'f-loc6', locationName:'Salar Jung Museum — Interior', scoutingDate:'2024-03-10', scoutingTeam:['Avinash Kolla','Shankar'], assignedManager:'Avinash Kolla', requirements:'Grand hall for political speech scene', observations:'Beautiful interiors but permission process lengthy', estimatedCost:300000, suitabilityRating:4, status:'approved', decision:'Approved — night shoot', notes:'', createdAt:now, updatedAt:now },
    { id:'sc2', projectId:'p4', locationId:'f-loc9', locationName:'Infosys Campus — Exterior', scoutingDate:'2024-03-15', scoutingTeam:['Avinash Kolla'], assignedManager:'Avinash Kolla', requirements:'Modern tech campus for rally scene', observations:'Perfect backdrop, good logistics', estimatedCost:100000, suitabilityRating:5, status:'shortlisted', decision:'', notes:'', createdAt:now, updatedAt:now },
    { id:'sc3', projectId:'p5', locationId:'f-loc8', locationName:'Rishikonda Beach', scoutingDate:'2025-04-20', scoutingTeam:['Karthik Palani','Nithin Zihani Choudhary'], assignedManager:'Karthik Palani', requirements:'Beach action sequence', observations:'Good beach access, local support available', estimatedCost:60000, suitabilityRating:4, status:'approved', decision:'Confirmed for July shoot', notes:'', createdAt:now, updatedAt:now },
    { id:'sc4', projectId:'p5', locationId:'f-loc10', locationName:'Lambasingi Hillside', scoutingDate:'2025-04-25', scoutingTeam:['Karthik Palani'], assignedManager:'Karthik Palani', requirements:'Misty highlands chase sequence', observations:'Excellent visual, limited access road', estimatedCost:40000, suitabilityRating:5, status:'shortlisted', decision:'', notes:'Need to check road access for equipment', createdAt:now, updatedAt:now },
    { id:'sc5', projectId:'p6', locationId:'f-loc11', locationName:'Qutb Shahi Tombs', scoutingDate:'2025-11-05', scoutingTeam:['Sailesh Kolanu','Sanu Varghese'], assignedManager:'Sailesh Kolanu', requirements:'Historic site for murder mystery scene', observations:'Atmospheric, permission challenging', estimatedCost:100000, suitabilityRating:3, status:'visited', decision:'Awaiting permission decision', notes:'ASI decision expected in 6 weeks', createdAt:now, updatedAt:now },
    { id:'sc6', projectId:'p6', locationId:'f-loc14', locationName:'Film Nagar Residential Bungalow', scoutingDate:'2025-11-12', scoutingTeam:['Sailesh Kolanu'], assignedManager:'Sailesh Kolanu', requirements:'Detective protagonist home', observations:'Ideal for protagonist home — modern design', estimatedCost:75000, suitabilityRating:5, status:'approved', decision:'Confirmed for interiors', notes:'', createdAt:now, updatedAt:now },
    { id:'sc7', projectId:'p7', locationId:'f-loc17', locationName:'Nagarjuna Sagar Dam Viewpoint', scoutingDate:'2026-01-08', scoutingTeam:['Rajeevan Nambiar'], assignedManager:'Rajeevan Nambiar', requirements:'Dramatic horror reveal location', observations:'Spectacular but security clearance complex', estimatedCost:200000, suitabilityRating:4, status:'visited', decision:'Exploring alternatives in parallel', notes:'', createdAt:now, updatedAt:now },
    { id:'sc8', projectId:'p7', locationId:'f-loc18', locationName:'Heritage Haveli — Old City', scoutingDate:'2026-01-12', scoutingTeam:['Rajeevan Nambiar','Karthika Srinivas'], assignedManager:'Rajeevan Nambiar', requirements:'Haunted haveli for horror sequences', observations:'Perfect atmosphere, cooperative owners', estimatedCost:120000, suitabilityRating:5, status:'shortlisted', decision:'Top candidate', notes:'', createdAt:now, updatedAt:now },
    { id:'sc9', projectId:'p6', locationId:'f-loc13', locationName:'Sri City Industrial Campus', scoutingDate:'2025-11-20', scoutingTeam:['Sailesh Kolanu'], assignedManager:'Sailesh Kolanu', requirements:'Tech lab for climax scene', observations:'Modern aesthetic but NDA process slow', estimatedCost:150000, suitabilityRating:3, status:'under-review', decision:'', notes:'NDA under legal review', createdAt:now, updatedAt:now },
    { id:'sc10', projectId:'p5', locationId:'f-loc12', locationName:'Pattiseema Village', scoutingDate:'2025-05-02', scoutingTeam:['Karthik Palani'], assignedManager:'Karthik Palani', requirements:'Rural village scenes', observations:'Authentic village, very cooperative locals', estimatedCost:25000, suitabilityRating:5, status:'approved', decision:'Approved', notes:'', createdAt:now, updatedAt:now },
    { id:'sc11', projectId:'p7', locationId:'f-loc15', locationName:'KBR National Park', scoutingDate:'2026-01-20', scoutingTeam:['Rajeevan Nambiar'], assignedManager:'Rajeevan Nambiar', requirements:'Forest chase sequence', observations:'Good forest density, manageable permits', estimatedCost:30000, suitabilityRating:4, status:'planned', decision:'', notes:'Scouting planned for next week', createdAt:now, updatedAt:now },
    { id:'sc12', projectId:'p7', locationId:'f-loc7', locationName:'Necklace Road Stretch', scoutingDate:'2026-01-25', scoutingTeam:['Rajeevan Nambiar','Karthika Srinivas'], assignedManager:'Rajeevan Nambiar', requirements:'Night car chase', observations:'Ideal for night chase, permits obtainable', estimatedCost:50000, suitabilityRating:4, status:'scheduled', decision:'', notes:'Scouting scheduled for Jan 25', createdAt:now, updatedAt:now },
  ];
  console.log('Seeded locationScouting:', d.locationScouting.length);
}

// ─── Location Agreements ─────────────────────────────────────────────────────

if (!d.locationAgreements || d.locationAgreements.length === 0) {
  const mkAgr = (id, projectId, locationId, start, end, agreed, deposit, totalPaid, permStatus, status) => ({
    id, projectId, locationId, usageStartDate:start, usageEndDate:end,
    agreedAmount:agreed, deposit, depositPaid:deposit>0, totalPaid,
    agreementReference:'AGR-'+id.toUpperCase(), permissionStatus:permStatus,
    status, notes:'', createdAt:now, updatedAt:now
  });
  d.locationAgreements = [
    mkAgr('la1','p1','f-loc1','2024-08-01','2024-09-30',150000*20,300000,150000*20+300000,'approved','completed'),
    mkAgr('la2','p1','f-loc3','2024-08-05','2024-08-10',150000*6,300000,150000*6+300000,'approved','completed'),
    mkAgr('la3','p1','f-loc4','2024-08-15','2024-08-20',80000*6,160000,80000*6+160000,'approved','completed'),
    mkAgr('la4','p2','f-loc1','2024-01-20','2024-04-30',500000*70,1500000,500000*70+1500000,'approved','completed'),
    mkAgr('la5','p2','f-loc5','2024-02-01','2024-03-15',200000*10,500000,200000*10+500000,'approved','completed'),
    mkAgr('la6','p3','f-loc16','2024-03-15','2024-05-30',800000*20,2000000,800000*20+2000000,'approved','completed'),
    mkAgr('la7','p3','f-loc8','2024-04-01','2024-04-20',60000*20,120000,60000*20+120000,'approved','completed'),
    mkAgr('la8','p4','f-loc1','2024-04-01','2024-07-31',500000*60,1500000,500000*60+1500000,'approved','completed'),
    mkAgr('la9','p4','f-loc9','2024-05-01','2024-06-30',100000*15,200000,100000*15+200000,'approved','completed'),
    mkAgr('la10','p5','f-loc8','2025-06-15','2025-07-31',60000*30,120000,60000*30,'approved','active'),
    mkAgr('la11','p5','f-loc12','2025-07-01','2025-07-15',25000*15,25000,25000*15+25000,'approved','active'),
    mkAgr('la12','p6','f-loc14','2026-02-15','2026-04-30',75000*30,150000,150000,'approved','pending'),
    mkAgr('la13','p6','f-loc6','2026-03-01','2026-03-15',300000*10,600000,0,'under-review','pending'),
    mkAgr('la14','p1','f-loc7','2024-08-22','2024-08-23',50000*2,0,100000,'approved','completed'),
    mkAgr('la15','p5','f-loc10','2025-08-01','2025-08-10',40000*10,50000,0,'approved','active'),
  ];
  console.log('Seeded locationAgreements:', d.locationAgreements.length);
}

// ─── Location Payments ───────────────────────────────────────────────────────

if (!d.locationPayments || d.locationPayments.length === 0) {
  const lp = [];
  let lpid = 1;
  const completed = ['la1','la2','la3','la4','la5','la6','la7','la8','la9','la14'];
  (d.locationAgreements||[]).filter(a=>completed.includes(a.id)).forEach(a=>{
    if(a.deposit>0){
      lp.push({id:'lp'+lpid++, agreementId:a.id, projectId:a.projectId, locationId:a.locationId, amount:a.deposit, isDeposit:true, paymentDate:a.usageStartDate, referenceNumber:'DEP-'+a.id.toUpperCase(), notes:'Security deposit', recordedBy:'Production Manager', createdAt:now});
    }
    lp.push({id:'lp'+lpid++, agreementId:a.id, projectId:a.projectId, locationId:a.locationId, amount:a.agreedAmount, isDeposit:false, paymentDate:a.usageStartDate, referenceNumber:'PAY-'+a.id.toUpperCase(), notes:'Location fee', recordedBy:'Production Manager', createdAt:now});
  });
  // Partial payment for active agreements
  const la10 = (d.locationAgreements||[]).find(a=>a.id==='la10');
  if(la10){lp.push({id:'lp'+lpid++, agreementId:'la10', projectId:'p5', locationId:'f-loc8', amount:la10.deposit, isDeposit:true, paymentDate:'2025-06-15', referenceNumber:'DEP-LA10', notes:'Deposit', recordedBy:'Production Manager', createdAt:now});}
  const la11 = (d.locationAgreements||[]).find(a=>a.id==='la11');
  if(la11){lp.push({id:'lp'+lpid++, agreementId:'la11', projectId:'p5', locationId:'f-loc12', amount:la11.agreedAmount+la11.deposit, isDeposit:false, paymentDate:'2025-07-01', referenceNumber:'PAY-LA11', notes:'Full payment', recordedBy:'Production Manager', createdAt:now});}
  const la12 = (d.locationAgreements||[]).find(a=>a.id==='la12');
  if(la12){lp.push({id:'lp'+lpid++, agreementId:'la12', projectId:'p6', locationId:'f-loc14', amount:la12.deposit, isDeposit:true, paymentDate:'2026-01-15', referenceNumber:'DEP-LA12', notes:'Deposit paid on agreement', recordedBy:'Production Manager', createdAt:now});}
  d.locationPayments = lp;
  console.log('Seeded locationPayments:', d.locationPayments.length);
}

// ─── Hotels ──────────────────────────────────────────────────────────────────

if (!d.hotels || d.hotels.length === 0) {
  d.hotels = [
    { id:'h1', name:'ITC Kakatiya', accommodationType:'hotel', address:'Begumpet, Hyderabad', city:'Hyderabad', contactPerson:'Preethi Menon', phone:'9849300001', email:'reservations@itckakatiya.com', facilities:'5-star, pool, gym, multiple restaurants', vendorId:'v16', createdAt:now },
    { id:'h2', name:'Taj Banjara Hills', accommodationType:'hotel', address:'Banjara Hills, Hyderabad', city:'Hyderabad', contactPerson:'Harish Nair', phone:'9849300002', email:'reservations@tajbanjara.com', facilities:'5-star, spa, banquet halls, restaurants', createdAt:now },
    { id:'h3', name:'Novotel Hyderabad Convention Centre', accommodationType:'hotel', address:'HITEC City, Hyderabad', city:'Hyderabad', contactPerson:'Sunita Reddy', phone:'9849300003', email:'reservations@novotel.hyd.com', facilities:'4-star, convention centre, gym, restaurant', createdAt:now },
    { id:'h4', name:'Marriott Hyderabad', accommodationType:'hotel', address:'Tank Bund Road, Hyderabad', city:'Hyderabad', contactPerson:'Rajesh Kumar', phone:'9849300004', email:'reservations@marriott.hyd.com', facilities:'5-star, rooftop pool, spa, multiple dining', createdAt:now },
    { id:'h5', name:'Fortune Murali Park', accommodationType:'hotel', address:'Waltair Main Road, Vizag', city:'Visakhapatnam', contactPerson:'Suresh Nair', phone:'9849300005', email:'reservations@fortunemurali.com', facilities:'4-star, sea view, restaurant, gym', createdAt:now },
    { id:'h6', name:'The Park Hotel Vizag', accommodationType:'hotel', address:'Beach Road, Visakhapatnam', city:'Visakhapatnam', contactPerson:'Meena Krishnan', phone:'9849300006', email:'reservations@theparkvisakha.com', facilities:'5-star, beach access, pool, spa', createdAt:now },
    { id:'h7', name:'Fern Hotel Vijayawada', accommodationType:'hotel', address:'M.G. Road, Vijayawada', city:'Vijayawada', contactPerson:'Ravi Babu', phone:'9849300007', email:'reservations@fernvijayawada.com', facilities:'4-star, conference room, restaurant', createdAt:now },
    { id:'h8', name:'Film Nagar Guest House', accommodationType:'guest-house', address:'Plot 11, Film Nagar, Hyderabad', city:'Hyderabad', contactPerson:'Narsimha Rao', phone:'9849300008', email:'filmnagar.gh@gmail.com', facilities:'8 rooms, kitchen, parking, AC', notes:'Used for crew stays during shoots', createdAt:now },
  ];
  console.log('Seeded hotels:', d.hotels.length);
}

// ─── Hotel Bookings ──────────────────────────────────────────────────────────

if (!d.hotelBookings || d.hotelBookings.length === 0) {
  const mkB = (id, projectId, hotelId, guestName, guestType, castId, crewId, roomType, nights, rate, addl, disc, deposit, totalPaid, status, checkIn, checkOut) => {
    const total = Math.max(0, nights*rate + addl - disc);
    return { id, projectId, hotelId, guestName, guestType, castMemberId:castId||undefined, crewMemberId:crewId||undefined, roomType, occupants:1, checkInDate:checkIn, checkOutDate:checkOut, nights, ratePerNight:rate, additionalCharges:addl, discount:disc, totalAmount:total, deposit, depositPaid:deposit>0, totalPaid, status, notes:'', createdAt:now, updatedAt:now };
  };
  d.hotelBookings = [
    // p1 — Pushpa 2 (completed)
    mkB('hb1','p1','h1','Allu Arjun','cast','c1',null,'Presidential Suite',60,25000,0,0,50000,25000*60+50000,'checked-out','2024-08-01','2024-09-30'),
    mkB('hb2','p1','h1','Rashmika Mandanna','cast','c2',null,'Deluxe Suite',30,18000,0,0,30000,18000*30+30000,'checked-out','2024-08-01','2024-08-31'),
    mkB('hb3','p1','h3','Sukumar','crew',null,'cr1','Executive Room',60,8000,0,0,0,8000*60,'checked-out','2024-08-01','2024-09-30'),
    mkB('hb4','p1','h8','Peter Hein','crew',null,'cr6','Standard Room',45,3500,0,0,0,3500*45,'checked-out','2024-08-01','2024-09-15'),
    mkB('hb5','p1','h8','S. Ramakrishna','crew',null,'cr5','Standard Room',45,3500,0,0,0,3500*45,'checked-out','2024-08-01','2024-09-15'),
    // p2 — Kalki (completed)
    mkB('hb6','p2','h4','Prabhas','cast','c5',null,'Presidential Suite',105,25000,0,0,50000,25000*105+50000,'checked-out','2024-01-15','2024-04-30'),
    mkB('hb7','p2','h4','Amitabh Bachchan','cast','c6',null,'Presidential Suite',30,25000,50000,0,50000,25000*30+50000+50000,'checked-out','2024-01-15','2024-02-14'),
    mkB('hb8','p2','h1','Deepika Padukone','cast','c16',null,'Deluxe Suite',60,22000,0,0,30000,22000*60+30000,'checked-out','2024-02-01','2024-04-01'),
    mkB('hb9','p2','h3','Nag Ashwin','crew',null,'cr7','Executive Room',105,8000,0,0,0,8000*105,'checked-out','2024-01-15','2024-04-30'),
    mkB('hb10','p2','h3','Djordje Stojiljkovic','crew',null,'cr8','Deluxe Room',90,6000,0,0,0,6000*90,'checked-out','2024-01-20','2024-04-20'),
    // p3 — Devara (completed)
    mkB('hb11','p3','h5','N. T. Rama Rao Jr.','cast','c8',null,'Deluxe Suite',30,15000,0,0,25000,15000*30+25000,'checked-out','2024-04-01','2024-05-01'),
    mkB('hb12','p3','h5','Janhvi Kapoor','cast','c9',null,'Deluxe Room',20,12000,0,0,20000,12000*20+20000,'checked-out','2024-04-15','2024-05-05'),
    mkB('hb13','p3','h6','Koratala Siva','crew',null,'cr10','Executive Room',60,8000,0,0,0,8000*60,'checked-out','2024-03-15','2024-05-15'),
    // p4 — Game Changer (completed)
    mkB('hb14','p4','h2','Ram Charan','cast','c17',null,'Presidential Suite',90,22000,0,0,40000,22000*90+40000,'checked-out','2024-04-01','2024-07-01'),
    mkB('hb15','p4','h2','Kiara Advani','cast','c18',null,'Deluxe Suite',45,18000,0,0,30000,18000*45+30000,'checked-out','2024-05-01','2024-06-15'),
    mkB('hb16','p4','h3','S. Shankar','crew',null,'cr20','Executive Room',90,8000,0,0,0,8000*90,'checked-out','2024-04-01','2024-07-01'),
    // p5 — OG (active)
    mkB('hb17','p5','h1','Pawan Kalyan','cast','c11',null,'Presidential Suite',0,25000,0,0,50000,50000,'confirmed','2025-09-01','2025-09-30'),
    mkB('hb18','p5','h1','Priyanka Mohan','cast','c20',null,'Deluxe Suite',30,15000,0,0,25000,15000*30+25000,'checked-in','2025-06-15','2025-07-15'),
    mkB('hb19','p5','h3','Sujeeth','crew',null,'cr14','Executive Room',0,8000,0,0,0,0,'confirmed','2025-08-01','2025-09-30'),
    mkB('hb20','p5','h8','Karthik Palani','crew',null,'cr33','Standard Room',30,3500,0,0,0,3500*30,'checked-in','2025-06-15','2025-07-15'),
    mkB('hb21','p5','h8','Nithin Zihani Choudhary','crew',null,'cr17','Standard Room',30,3500,0,0,0,3500*30,'checked-in','2025-06-15','2025-07-15'),
    // p6/p7 — pre-production
    mkB('hb22','p6','h8','Sailesh Kolanu','crew',null,'cr28','Standard Room',0,3500,0,0,0,0,'requested','2026-02-01','2026-04-30'),
    mkB('hb23','p7','h8','Rajeevan Nambiar','crew',null,'cr36','Standard Room',0,3500,0,0,0,0,'requested','2026-03-01','2026-05-31'),
    mkB('hb24','p5','h3','Mickey J. Meyer','crew',null,'cr31','Standard Room',15,4000,0,0,0,0,'cancelled','2025-07-01','2025-07-15'),
    mkB('hb25','p5','h3','Maruthi','crew',null,'cr32','Standard Room',15,4000,0,0,0,0,'cancelled','2025-07-01','2025-07-15'),
  ];
  // Fix nights for confirmed/requested/cancelled bookings
  d.hotelBookings.forEach(b => {
    if(b.status==='confirmed'||b.status==='requested'){
      const n = Math.round((new Date(b.checkOutDate)-new Date(b.checkInDate))/(86400000));
      b.nights = Math.max(0,n);
      b.totalAmount = Math.max(0, b.nights*b.ratePerNight + b.additionalCharges - b.discount);
    }
    if(b.status==='cancelled') b.totalPaid=0;
  });
  console.log('Seeded hotelBookings:', d.hotelBookings.length);
}

// ─── Hotel Payments ───────────────────────────────────────────────────────────

if (!d.hotelPayments || d.hotelPayments.length === 0) {
  const hp = [];
  let hpid = 1;
  (d.hotelBookings||[]).filter(b=>b.totalPaid>0&&!['cancelled'].includes(b.status)).forEach(b=>{
    if(b.deposit>0&&b.depositPaid){
      hp.push({id:'hp'+hpid++, bookingId:b.id, projectId:b.projectId, hotelId:b.hotelId, amount:b.deposit, isDeposit:true, paymentDate:b.checkInDate||b.createdAt.slice(0,10), referenceNumber:'DEP-'+b.id.toUpperCase(), notes:'Booking deposit', recordedBy:'Production Manager', createdAt:now});
    }
    const rentalAmt = b.totalPaid - (b.depositPaid?b.deposit:0);
    if(rentalAmt>0){
      hp.push({id:'hp'+hpid++, bookingId:b.id, projectId:b.projectId, hotelId:b.hotelId, amount:rentalAmt, isDeposit:false, paymentDate:b.checkInDate||b.createdAt.slice(0,10), referenceNumber:'PAY-'+b.id.toUpperCase(), notes:'Hotel payment', recordedBy:'Production Manager', createdAt:now});
    }
  });
  d.hotelPayments = hp;
  console.log('Seeded hotelPayments:', d.hotelPayments.length);
}

// ─── Trips ───────────────────────────────────────────────────────────────────

if (!d.trips || d.trips.length === 0) {
  const mkTrip = (id, projectId, title, cat, vendor, bookRef, origin, dest, dep, arr, passengers, cost, addl, totalPaid, status, driver, vehicle) => ({
    id, projectId, title, category:cat, vendorProvider:vendor, bookingReference:bookRef,
    origin, destination:dest, departureDateTime:dep, arrivalDateTime:arr||undefined,
    passengers, vehicleDetails:vehicle||undefined, driverName:driver||undefined,
    ticketCost:cost, additionalCharges:addl, totalCost:cost+addl, totalPaid,
    status, notes:'', createdAt:now, updatedAt:now
  });

  d.trips = [
    // p1 — Pushpa 2
    mkTrip('tr1','p1','Core Team — Mumbai to Hyderabad','flight','IndiGo Airlines','6E-1234','Mumbai','Hyderabad','2024-07-30T07:00','2024-07-30T09:15',[{name:'Sukumar',guestType:'crew',crewMemberId:'cr1'},{name:'Naveen Nooli',guestType:'crew',crewMemberId:'cr3'},{name:'Allu Arjun',guestType:'cast',castMemberId:'c1'},{name:'Rashmika Mandanna',guestType:'cast',castMemberId:'c2'}],560000,0,560000,'completed',null,null),
    mkTrip('tr2','p1','Production Unit — Hyderabad to Vizag','train','Indian Railways','AP Express','Hyderabad','Visakhapatnam','2024-08-20T06:00','2024-08-20T15:00',[{name:'S. Ramakrishna',guestType:'crew',crewMemberId:'cr5'},{name:'Peter Hein',guestType:'crew',crewMemberId:'cr6'}],8000,500,8500,'completed',null,null),
    mkTrip('tr3','p1','VIP Transfer — Airport to Hotel','car','Srinivasa Travels','SRT-001','Hyderabad Airport','ITC Kakatiya','2024-07-30T09:30','2024-07-30T10:00',[{name:'Allu Arjun',guestType:'cast',castMemberId:'c1'}],5000,0,5000,'completed','Ramesh Driver','MH-12-AB-1234'),
    mkTrip('tr4','p1','Post-Shoot Return — Hyderabad to Mumbai','flight','Air India','AI-567','Hyderabad','Mumbai','2024-10-01T18:00','2024-10-01T20:00',[{name:'Allu Arjun',guestType:'cast',castMemberId:'c1'},{name:'Rashmika Mandanna',guestType:'cast',castMemberId:'c2'},{name:'Sukumar',guestType:'crew',crewMemberId:'cr1'}],420000,0,420000,'completed',null,null),
    // p2 — Kalki
    mkTrip('tr5','p2','Prabhas & Team — Chennai to Hyderabad','flight','IndiGo','6E-789','Chennai','Hyderabad','2024-01-14T09:00','2024-01-14T10:30',[{name:'Prabhas',guestType:'cast',castMemberId:'c5'},{name:'Nag Ashwin',guestType:'crew',crewMemberId:'cr7'}],180000,0,180000,'completed',null,null),
    mkTrip('tr6','p2','Amitabh Bachchan Special Charter','flight','Charter Air','PRIV-AMB','Mumbai','Hyderabad','2024-01-14T11:00','2024-01-14T12:30',[{name:'Amitabh Bachchan',guestType:'cast',castMemberId:'c6'}],800000,200000,1000000,'completed',null,null),
    mkTrip('tr7','p2','Deepika — Mumbai to Hyderabad','flight','Air India','AI-101','Mumbai','Hyderabad','2024-01-31T14:00','2024-01-31T16:00',[{name:'Deepika Padukone',guestType:'cast',castMemberId:'c16'}],180000,0,180000,'completed',null,null),
    mkTrip('tr8','p2','Post Production — International VFX','flight','Emirates','EK-501','Hyderabad','London','2024-05-05T21:00','2024-05-06T07:00',[{name:'Nag Ashwin',guestType:'crew',crewMemberId:'cr7'},{name:'Djordje Stojiljkovic',guestType:'crew',crewMemberId:'cr8'}],320000,60000,380000,'completed',null,null),
    // p3 — Devara
    mkTrip('tr9','p3','NTR — Hyderabad to Vizag','car','Srinivasa Travels','SRT-NTR-01','Hyderabad','Visakhapatnam','2024-03-31T06:00','2024-03-31T12:00',[{name:'N. T. Rama Rao Jr.',guestType:'cast',castMemberId:'c8'}],25000,0,25000,'completed','Balaji Driver','TS-09-CD-5678'),
    mkTrip('tr10','p3','Janhvi Kapoor — Mumbai to Vizag','flight','IndiGo','6E-3456','Mumbai','Visakhapatnam','2024-04-14T06:30','2024-04-14T08:30',[{name:'Janhvi Kapoor',guestType:'cast',castMemberId:'c9'}],180000,0,180000,'completed',null,null),
    mkTrip('tr11','p3','Production Unit — Underwater Set Transport','car','Production Vehicles','PROD-001','Hyderabad','Ramoji Film City','2024-03-15T07:00','2024-03-15T08:30',[{name:'Koratala Siva',guestType:'crew',crewMemberId:'cr10'},{name:'R. Rathnavelu',guestType:'crew',crewMemberId:'cr11'}],2000,0,2000,'completed','Naresh Driver','TS-09-EF-9012'),
    // p4 — Game Changer
    mkTrip('tr12','p4','Ram Charan — Hyderabad to Chennai','flight','IndiGo','6E-2345','Hyderabad','Chennai','2024-03-30T10:00','2024-03-30T11:30',[{name:'Ram Charan',guestType:'cast',castMemberId:'c17'}],120000,0,120000,'completed',null,null),
    mkTrip('tr13','p4','Shankar — Chennai to Hyderabad','flight','Air India','AI-202','Chennai','Hyderabad','2024-03-31T09:00','2024-03-31T10:30',[{name:'S. Shankar',guestType:'crew',crewMemberId:'cr20'}],85000,0,85000,'completed',null,null),
    mkTrip('tr14','p4','Kiara Advani — Mumbai to Hyderabad','flight','IndiGo','6E-4567','Mumbai','Hyderabad','2024-04-30T13:00','2024-04-30T15:00',[{name:'Kiara Advani',guestType:'cast',castMemberId:'c18'}],140000,0,140000,'completed',null,null),
    // p5 — OG (active)
    mkTrip('tr15','p5','Pawan Kalyan — Hyderabad to Chennai','flight','Air India','AI-303','Hyderabad','Chennai','2025-06-14T08:00','2025-06-14T09:30',[{name:'Pawan Kalyan',guestType:'cast',castMemberId:'c11'}],250000,0,250000,'booked',null,null),
    mkTrip('tr16','p5','Sujeeth — Hyderabad to Vizag','car','Srinivasa Travels','SRT-OG-02','Hyderabad','Visakhapatnam','2025-06-14T05:00','2025-06-14T12:00',[{name:'Sujeeth',guestType:'crew',crewMemberId:'cr14'}],15000,0,15000,'confirmed','Balaji Driver','TS-09-GH-3456'),
    mkTrip('tr17','p5','Unit Production — Vizag Beach Shoot','production-vehicle','Production Fleet','PROD-OG-001','ITC Kakatiya','Rishikonda Beach','2025-06-15T05:30','2025-06-15T07:00',[{name:'Karthik Palani',guestType:'crew',crewMemberId:'cr33'},{name:'Nithin Zihani Choudhary',guestType:'crew',crewMemberId:'cr17'}],5000,2000,7000,'confirmed','Ramesh Driver','AP-05-AB-7890'),
    mkTrip('tr18','p5','Srinidhi Shetty — Mumbai to Hyderabad','flight','IndiGo','6E-5678','Mumbai','Hyderabad','2025-07-01T10:00','2025-07-01T12:00',[{name:'Srinidhi Shetty',guestType:'cast',castMemberId:'c21'}],160000,0,80000,'in-transit',null,null),
    // p6/p7
    mkTrip('tr19','p6','Sailesh Kolanu — Location Survey Vizag','flight','IndiGo','6E-9012','Hyderabad','Visakhapatnam','2025-11-04T07:00','2025-11-04T08:30',[{name:'Sailesh Kolanu',guestType:'crew',crewMemberId:'cr28'}],12000,0,12000,'completed',null,null),
    mkTrip('tr20','p7','Rajeevan Nambiar — Nagarjuna Sagar Survey','car','Srinivasa Travels','SRT-RS-01','Hyderabad','Nagarjuna Sagar','2026-01-07T08:00','2026-01-07T11:00',[{name:'Rajeevan Nambiar',guestType:'crew',crewMemberId:'cr36'}],5000,1000,6000,'planned',null,null),
  ];
  console.log('Seeded trips:', d.trips.length);
}

// ─── Travel Payments ─────────────────────────────────────────────────────────

if (!d.travelPayments || d.travelPayments.length === 0) {
  const tp = [];
  let tpid = 1;
  (d.trips||[]).filter(t=>t.totalPaid>0&&t.status!=='cancelled').forEach(t=>{
    tp.push({id:'tp'+tpid++, tripId:t.id, projectId:t.projectId, amount:t.totalPaid, paymentDate:t.departureDateTime.slice(0,10), referenceNumber:'TRVPAY-'+t.id.toUpperCase(), notes:'Travel payment', recordedBy:'Production Manager', createdAt:now});
  });
  d.travelPayments = tp;
  console.log('Seeded travelPayments:', d.travelPayments.length);
}

// Summary
const agreements = d.locationAgreements||[];
const bookings = d.hotelBookings||[];
const trips = d.trips||[];
const locCost = agreements.filter(a=>a.status!=='cancelled').reduce((s,a)=>s+a.agreedAmount,0);
const locPaid = agreements.filter(a=>a.status!=='cancelled').reduce((s,a)=>s+a.totalPaid,0);
const activeBookings = bookings.filter(b=>!['cancelled','no-show'].includes(b.status));
const hotelCost = activeBookings.reduce((s,b)=>s+b.totalAmount,0);
const hotelPaid = activeBookings.reduce((s,b)=>s+b.totalPaid,0);
const activeTrips = trips.filter(t=>t.status!=='cancelled');
const travelCost = activeTrips.reduce((s,t)=>s+t.totalCost,0);
const travelPaid = activeTrips.reduce((s,t)=>s+t.totalPaid,0);

console.log('=== FINANCIAL SUMMARY ===');
console.log('Location Cost: ₹'+locCost.toLocaleString('en-IN'), '| Paid: ₹'+locPaid.toLocaleString('en-IN'));
console.log('Hotel Cost: ₹'+hotelCost.toLocaleString('en-IN'), '| Paid: ₹'+hotelPaid.toLocaleString('en-IN'));
console.log('Travel Cost: ₹'+travelCost.toLocaleString('en-IN'), '| Paid: ₹'+travelPaid.toLocaleString('en-IN'));
console.log('filmLocations:', d.filmLocations?.length, '| locationScouting:', d.locationScouting?.length);
console.log('locationAgreements:', d.locationAgreements?.length, '| locationPayments:', d.locationPayments?.length);
console.log('hotels:', d.hotels?.length, '| hotelBookings:', d.hotelBookings?.length, '| hotelPayments:', d.hotelPayments?.length);
console.log('trips:', d.trips?.length, '| travelPayments:', d.travelPayments?.length);

fs.writeFileSync(filePath, JSON.stringify(raw, null, 2));
console.log('Done. Version:', raw.version);
