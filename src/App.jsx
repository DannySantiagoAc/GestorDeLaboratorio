import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, query, Timestamp, setLogLevel 
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";

 import logoLocal from './assets/Sello.png';   
 import bgLocal from './assets/fondoredes.jpg';    
 import imgLocal from './assets/labo.webp'; 

// --- CONFIGURACIÓN DE SOPORTE ---
const SUPPORT_PHONE = "593992870769"; // CAMBIA ESTO por el número real (con código de país 593)
const SUPPORT_MESSAGE = "Hola, necesito ayuda con la plataforma del Laboratorio de Redes.";

// --- Recursos Estáticos ---
//const UCE_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/1/12/Logo_de_la_Universidad_Central_del_Ecuador.svg";
//const LAB_BG_URL = "https://images.unsplash.com/photo-1558494949-efc535b5c47c?q=80&w=1920&auto=format&fit=crop";
//const NETWORK_IMG_URL = "https://images.unsplash.com/photo-1544197150-b99a580bbcbf?q=80&w=1000&auto=format&fit=crop";
const UCE_LOGO_URL = logoLocal;
const LAB_BG_URL = bgLocal;
const NETWORK_IMG_URL = imgLocal;

// --- HORARIO DE CLASES ---
const HORARIO_CLASES = {
  1: [ // Lunes
    { start: '09:00', end: '11:00', label: 'Infraestructura de TI - I' },
    { start: '18:00', end: '20:00', label: 'Redes y Protocolos de Comunicación' }
  ],
  2: [ // Martes
    { start: '09:00', end: '11:00', label: 'Infraestructura de TI II' },
    { start: '11:00', end: '13:00', label: 'Infraestructura de TI - I' }
  ],
  3: [ // Miércoles
    { start: '09:00', end: '11:00', label: 'Infraestructura de TI I - PAE' },
    { start: '11:00', end: '13:00', label: 'Infraestructura de TI I - PAE' }
  ],
  4: [ // Jueves
    { start: '09:00', end: '11:00', label: 'Legislación Informática' },
    { start: '11:00', end: '13:00', label: 'Infraestructura de TI II' },
    { start: '18:00', end: '20:00', label: 'Redes y Protocolos de Comunicación' }
  ],
  5: [ // Viernes
    { start: '09:00', end: '11:00', label: 'Criptografía y Seguridad' }
  ]
};
// --- Iconos ---
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconFlask = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"></path><path d="M12 3v7c0 .6.4 1 1 1h.5c.6 0 1-.4 1-1V3"></path><path d="M12 13H6.09c-.5 0-.9.5-.8 1.1l.9 5.4c.1.5.5.9 1 .9h7.7c.5 0 1-.4 1-.9l.9-5.4c.1-.6-.2-1.1-.8-1.1H12Z"></path></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconUnlock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>;
const IconArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconWhatsapp = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;

// --- Configuración de Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBCxJZKyjgVBEmiNqTeMRQWxf7Ii08-C40",
  authDomain: "gesto-de-laboratorio.firebaseapp.com",
  projectId: "gesto-de-laboratorio",
  storageBucket: "gesto-de-laboratorio.firebasestorage.app",
  messagingSenderId: "289999260378",
  appId: "1:289999260378:web:a7dad71a55a806a7bd33e3",
  measurementId: "G-KTVQHYN4ZY"
};
const appId = 'laboratorio-redes-v2';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setLogLevel('silent'); 

// --- Componente Principal ---
function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'dashboard', 'manage', 'reports'
  const [user, setUser] = useState(null); 
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const dataPath = `artifacts/${appId}/public/data`; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubGroups = onSnapshot(query(collection(db, `${dataPath}/groups`)), (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSessions = onSnapshot(query(collection(db, `${dataPath}/sessions`)), (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate()
      }));
      setSessions(sessionsData);
      setLoading(false);
    });

    return () => { unsubGroups(); unsubSessions(); };
  }, []);

  const { currentSessions, upcomingSessions, pastSessions } = useMemo(() => {
    const now = new Date();
    const sorted = sessions.sort((a, b) => a.startTime - b.startTime);

    return {
      currentSessions: sorted.filter(s => s.startTime <= now && s.endTime > now),
      upcomingSessions: sorted.filter(s => s.startTime > now),
      pastSessions: sorted.filter(s => s.endTime <= now).reverse() // Las más recientes primero
    };
  }, [sessions]);

  const handleLogout = async () => { await signOut(auth); setCurrentView('landing'); };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 relative">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onLogoutClick={handleLogout}
      />
      
      <main>
        {currentView === 'landing' && <LandingView onEnter={() => setCurrentView('dashboard')} />}

        {currentView !== 'landing' && (
          <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[85vh]">
            {!authInitialized || loading ? (
              <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <DashboardView
                    currentSessions={currentSessions}
                    upcomingSessions={upcomingSessions}
                    allSessions={sessions} 
                    groups={groups}
                    db={db}
                    dataPath={dataPath}
                    user={user}
                    onOpenLogin={() => setShowLoginModal(true)}
                  />
                )}
                {currentView === 'manage' && <ManageGroupsView groups={groups} db={db} dataPath={dataPath} />}
                {currentView === 'reports' && <ReportsView pastSessions={pastSessions} />}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p>© 2025 Universidad Central del Ecuador - Ingeniería y Ciencias Aplicadas</p>
          <p className="mt-2 md:mt-0">Desarrollado para gestión académica.</p>
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp */}
      <a 
        href={`https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center animate-bounce-slow"
        title="Contactar Soporte Técnico"
      >
        <IconWhatsapp />
      </a>

      {showLoginModal && <AuthModal auth={auth} onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}

// --- Vista: Landing Page ---
function LandingView({ onEnter }) {
  return (
    <div className="flex flex-col">
      <div className="relative h-[500px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={LAB_BG_URL} alt="Laboratorio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-slate-900/80"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
            LABORATORIO DE <span className="text-blue-400">REDES</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Plataforma integral para la gestión, simulación y prácticas de infraestructura de red de la Universidad Central del Ecuador.
          </p>
          <button onClick={onEnter} className="group bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center mx-auto">
            Ingresar al Sistema <span className="ml-2 group-hover:translate-x-1 transition-transform"><IconArrowRight /></span>
          </button>
        </div>
      </div>
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 border-l-4 border-blue-600 pl-4">Objetivos del Laboratorio</h2>
            <p className="text-slate-600 leading-relaxed">
              Este espacio está dedicado a la formación práctica de los estudiantes en tecnologías de telecomunicaciones, enrutamiento, conmutación y seguridad informática.
            </p>
            <ul className="space-y-3 mt-4">
              {['Configuración de Equipos Cisco/Mikrotik', 'Análisis de Tráfico de Red', 'Implementación de VLANs y VPNs', 'Seguridad Perimetral'].map((item, i) => (
                <li key={i} className="flex items-center text-slate-700"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
            <img src={NETWORK_IMG_URL} alt="Equipos de Red" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Componente: Header ---
function Header({ currentView, setCurrentView, user, onLoginClick, onLogoutClick }) {
  const isLanding = currentView === 'landing';
  const navBtn = (view, label) => (
    <button onClick={() => setCurrentView(view)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentView === view ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
      {label}
    </button>
  );
  
  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${isLanding ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white shadow-md'}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('landing')}>
          <img src={UCE_LOGO_URL} alt="Logo UCE" className="h-12 w-auto mr-3" />
          <div className="border-l border-slate-300 pl-3">
            <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-none">Laboratorio de Redes</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-widest uppercase mt-1">Universidad Central del Ecuador</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {!isLanding && (
            <>
              {navBtn('dashboard', 'Panel')}
              {user && navBtn('manage', 'Grupos')}
              {user && navBtn('reports', 'Reportes')}
            </>
          )}
          <div className="border-l pl-4 border-slate-300 ml-2">
            {user ? (
              <button onClick={onLogoutClick} className="flex items-center space-x-1 text-red-600 font-medium text-sm hover:text-red-800">
                <IconUnlock /> <span className="hidden md:inline">Salir</span>
              </button>
            ) : (
              <button onClick={onLoginClick} className="flex items-center space-x-1 text-blue-600 font-medium text-sm hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
                <IconLock /> <span className="hidden md:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// --- Componente: ReportsView (NUEVO) ---
function ReportsView({ pastSessions }) {
  const downloadCSV = () => {
    // Encabezados del CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Hora Inicio,Hora Fin,Grupo,Equipo,Practica Realizada\n";

    // Filas de datos
    pastSessions.forEach(row => {
      const date = row.startTime.toLocaleDateString();
      const start = row.startTime.toLocaleTimeString();
      const end = row.endTime.toLocaleTimeString();
      // Escapar comas en los textos para no romper el CSV
      const group = `"${row.groupName || ''}"`;
      const team = `"${row.teamName || ''}"`;
      const practice = `"${row.practiceName || ''}"`;
      
      csvContent += `${date},${start},${end},${group},${team},${practice}\n`;
    });

    // Crear link de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_laboratorio_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Historial de Asistencias</h2>
          <p className="text-slate-500">Registro completo de prácticas realizadas en el laboratorio.</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow transition-colors"
        >
          <IconDownload /> <span>Exportar Excel (CSV)</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {pastSessions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No hay registros de sesiones pasadas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Horario</th>
                  <th className="px-6 py-3">Grupo</th>
                  <th className="px-6 py-3">Equipo</th>
                  <th className="px-6 py-3">Práctica</th>
                </tr>
              </thead>
              <tbody>
                {pastSessions.map((s) => (
                  <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {s.startTime.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {s.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {s.endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-4">{s.groupName}</td>
                    <td className="px-6 py-4">{s.teamName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {s.practiceName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Componente: DashboardView ---
function DashboardView({ currentSessions, upcomingSessions, allSessions, groups, db, dataPath, user, onOpenLogin }) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta sesión?")) return;
    try { await deleteDoc(doc(db, `${dataPath}/sessions`, sessionId)); } catch (e) { alert("Error al eliminar"); }
  };
  const SessionCard = ({ session, isActive }) => (
    <div className={`relative p-4 rounded-lg border ${isActive ? 'bg-white border-l-4 border-l-green-500 shadow-md' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-800">{session.practiceName}</h3>
          <div className="text-sm text-slate-600 mt-1 space-y-1">
            <p className="flex items-center"><span className="font-semibold mr-1">Grupo:</span> {session.groupName}</p>
            <p className="flex items-center"><span className="font-semibold mr-1">Equipo:</span> {session.teamName}</p>
            <p className="flex items-center text-blue-600"><IconClock /> <span className="ml-1">{session.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {session.endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></p>
          </div>
        </div>
        {user && <button onClick={() => handleDeleteSession(session.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"><IconTrash /></button>}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      <div className="lg:col-span-8 space-y-6">
        <div className={`rounded-xl p-6 text-white shadow-lg ${currentSessions.length > 0 ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}>
          <h2 className="text-3xl font-bold mb-2">{currentSessions.length > 0 ? `Laboratorio Ocupado (${currentSessions.length} grupos)` : 'Laboratorio Disponible'}</h2>
          <p className="opacity-90">{currentSessions.length > 0 ? 'Prácticas en curso.' : 'El laboratorio está libre.'}</p>
        </div>
        {currentSessions.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>En Curso Ahora</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{currentSessions.map(s => <SessionCard key={s.id} session={s} isActive={true} />)}</div>
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-3">Próximas Sesiones</h3>
          {upcomingSessions.length === 0 ? (
            <div className="text-slate-400 italic bg-white p-8 rounded-lg border border-dashed border-slate-300 text-center">No hay más sesiones programadas.</div>
          ) : (
            <div className="space-y-3">{upcomingSessions.map(s => <SessionCard key={s.id} session={s} isActive={false} />)}</div>
          )}
        </div>
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-4 text-slate-800">Acciones</h3>
          {user ? (
            <>
              <button onClick={() => setShowScheduleModal(true)} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5">
                <div className="bg-white/20 p-1 rounded-md mr-3"><IconPlus /></div>Agendar Sesión
              </button>
            </>
          ) : (
            <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600 mb-3 text-sm">Necesitas permisos para agendar.</p>
              <button onClick={onOpenLogin} className="text-blue-600 font-semibold text-sm hover:underline">Iniciar Sesión Admin</button>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Normativa</h4>
             <div className="mb-4 bg-blue-50 p-3 rounded text-xs text-blue-800"><strong>Info:</strong> Respeta los horarios de clase.</div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start"><span className="mr-2 text-blue-500">•</span> Máx 4 grupos simultáneos.</li>
              <li className="flex items-start"><span className="mr-2 text-blue-500">•</span> Duración máx: 3 horas.</li>
            </ul>
          </div>
        </div>
      </div>
      {showScheduleModal && <ScheduleSessionModal groups={groups} allSessions={allSessions} db={db} dataPath={dataPath} onClose={() => setShowScheduleModal(false)} />}
    </div>
  );
}

// --- Componente: ManageGroupsView ---
function ManageGroupsView({ groups, db, dataPath }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLeader, setNewGroupLeader] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAdd = async (e) => {
    e.preventDefault(); if(!newGroupName || !newGroupLeader) return; setLoading(true);
    const members = newGroupMembers.split(',').map(m => m.trim()).filter(m => m);
    if (!members.includes(newGroupLeader)) members.unshift(newGroupLeader);
    await addDoc(collection(db, `${dataPath}/groups`), { name: newGroupName, leader: newGroupLeader, members: members });
    setNewGroupName(''); setNewGroupLeader(''); setNewGroupMembers(''); setLoading(false);
  };
  const handleDelete = async (id) => { if(window.confirm("¿Eliminar?")) await deleteDoc(doc(db, `${dataPath}/groups`, id)); };
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
        <h2 className="text-lg font-bold mb-4">Registrar Nuevo Grupo</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700">Nombre</label><input className="w-full mt-1 p-2 border rounded-md" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-slate-700">Líder</label><input className="w-full mt-1 p-2 border rounded-md" value={newGroupLeader} onChange={e => setNewGroupLeader(e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-slate-700">Integrantes</label><textarea className="w-full mt-1 p-2 border rounded-md" rows="3" value={newGroupMembers} onChange={e => setNewGroupMembers(e.target.value)} /></div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300">{loading ? '...' : 'Guardar'}</button>
        </form>
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700">Grupos ({groups.length})</h2>
        {groups.map(g => (
          <div key={g.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div><h3 className="font-bold text-slate-800">{g.name}</h3><p className="text-sm text-slate-500">Líder: {g.leader}</p></div>
            <button onClick={() => handleDelete(g.id)} className="text-slate-400 hover:text-red-500 p-2"><IconTrash /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Modal de Agendar ---
function ScheduleSessionModal({ groups, allSessions, db, dataPath, onClose }) {
  const [formData, setFormData] = useState({ groupId: '', teamName: '', practiceName: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const startStr = now.toISOString().slice(0, 16);
    const end = new Date(now); end.setHours(end.getHours() + 2);
    const endStr = end.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, startTime: startStr, endTime: endStr }));
  }, []);
  const checkForClassConflict = (start, end) => {
    const day = start.getDay(); const dayClasses = HORARIO_CLASES[day]; if (!dayClasses) return null;
    const toMinutes = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; };
    const sStart = start.getHours() * 60 + start.getMinutes(); const sEnd = end.getHours() * 60 + end.getMinutes();
    for (const c of dayClasses) { if (sStart < toMinutes(c.end) && sEnd > toMinutes(c.start)) return `Conflicto con clase: ${c.label}`; }
    return null;
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!formData.groupId || !formData.practiceName) return setError("Faltan datos.");
    const start = new Date(formData.startTime); const end = new Date(formData.endTime);
    if (end <= start) return setError("Hora fin incorrecta.");
    if ((end - start) / 36e5 > 3) return setError("Máx 3 horas.");
    const conflict = checkForClassConflict(start, end); if (conflict) return setError(conflict);
    const overlap = allSessions.filter(s => s.startTime < end && s.endTime > start);
    if (overlap.length >= 4) return setError("Sin cupo.");
    setIsSubmitting(true);
    try {
      const g = groups.find(x => x.id === formData.groupId);
      await addDoc(collection(db, `${dataPath}/sessions`), { ...formData, groupName: g?.name || '?', startTime: Timestamp.fromDate(start), endTime: Timestamp.fromDate(end) });
      onClose();
    } catch (e) { setError("Error al guardar."); }
    setIsSubmitting(false);
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-blue-600 p-4 flex justify-between text-white"><h2 className="font-bold">Agendar</h2><button onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-2 text-sm border border-red-200">{error}</div>}
          <select className="w-full p-2 border rounded" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})}>
            <option value="">Seleccionar Grupo...</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full p-2 border rounded" placeholder="Equipo" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Práctica" value={formData.practiceName} onChange={e => setFormData({...formData, practiceName: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="datetime-local" className="w-full p-2 border rounded" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            <input type="datetime-local" className="w-full p-2 border rounded" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
          </div>
          <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded font-bold">{isSubmitting ? '...' : 'Confirmar'}</button>
        </form>
      </div>
    </div>
  );
}

// --- Auth Modal ---
function AuthModal({ auth, onClose }) {
  const [isReg, setIsReg] = useState(false); const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [err, setErr] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault(); setErr('');
    try { if (isReg) await createUserWithEmailAndPassword(auth, email, pass); else await signInWithEmailAndPassword(auth, email, pass); onClose(); }
    catch (e) { setErr("Error de credenciales."); }
  };
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">{isReg ? 'Registro' : 'Login Admin'}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" required className="w-full p-3 border rounded" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" />
          <input type="password" required className="w-full p-3 border rounded" value={pass} onChange={e => setPass(e.target.value)} placeholder="Contraseña" />
          {err && <p className="text-red-500 text-sm text-center">{err}</p>}
          <button className="w-full bg-slate-900 text-white py-3 rounded font-bold">{isReg ? 'Registrar' : 'Entrar'}</button>
        </form>
        <button onClick={() => setIsReg(!isReg)} className="block w-full text-center text-sm text-blue-600 mt-4">{isReg ? 'Login' : 'Crear cuenta'}</button>
        <button onClick={onClose} className="block w-full text-center text-xs text-slate-400 mt-2">Cancelar</button>
      </div>
    </div>
  );
}

export default App;