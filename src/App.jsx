import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, query, Timestamp, setLogLevel 
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";

// --- Iconos ---
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconFlask = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"></path><path d="M12 3v7c0 .6.4 1 1 1h.5c.6 0 1-.4 1-1V3"></path><path d="M12 13H6.09c-.5 0-.9.5-.8 1.1l.9 5.4c.1.5.5.9 1 .9h7.7c.5 0 1-.4 1-.9l.9-5.4c.1-.6-.2-1.1-.8-1.1H12Z"></path></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconUnlock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>;

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
const appId = 'laboratorio-fisc-2025';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setLogLevel('silent'); // Reducir ruido en consola

// --- Componente Principal: App ---
function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'manage'
  const [user, setUser] = useState(null); // Usuario autenticado
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Modal de Login
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Datos
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rutas de Firestore (Usamos una ruta global pública para lectura, pero protegida para escritura por UI)
  // NOTA: En producción, se deben configurar Reglas de Seguridad en Firebase console.
  const dataPath = `artifacts/${appId}/public/data`; 

  // Efecto de Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Efecto de Datos (Listeners en tiempo real)
  useEffect(() => {
    // Escuchamos siempre, estemos logueados o no (lectura pública)
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

    return () => {
      unsubGroups();
      unsubSessions();
    };
  }, []);

  const { currentSessions, upcomingSessions } = useMemo(() => {
    const now = new Date();
    const sorted = sessions
      .filter(s => s.endTime && s.endTime > now)
      .sort((a, b) => a.startTime - b.startTime);

    return {
      currentSessions: sorted.filter(s => s.startTime <= now && s.endTime > now),
      upcomingSessions: sorted.filter(s => s.startTime > now)
    };
  }, [sessions]);

  // Manejador de Logout
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('dashboard'); // Volver al inicio al salir
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onLogoutClick={handleLogout}
      />
      
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {!authInitialized || loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <DashboardView
                currentSessions={currentSessions}
                upcomingSessions={upcomingSessions}
                allSessions={sessions} // Pasamos todas para validar cruces
                groups={groups}
                db={db}
                dataPath={dataPath}
                user={user} // Pasamos usuario para saber si mostrar botones de admin
                onOpenLogin={() => setShowLoginModal(true)}
              />
            )}
            {currentView === 'manage' && (
              <ManageGroupsView
                groups={groups}
                db={db}
                dataPath={dataPath}
              />
            )}
          </>
        )}
      </main>

      {/* Modal de Login */}
      {showLoginModal && (
        <AuthModal 
          auth={auth} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
}

// --- Componente: Header ---
function Header({ currentView, setCurrentView, user, onLoginClick, onLogoutClick }) {
  const navBtn = (view, label) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        currentView === view 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <IconFlask />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
              Laboratorio de Redes
            </h1>
            <p className="text-xs text-slate-500 hidden md:block">Sistema de Gestión de Horarios</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {navBtn('dashboard', 'Panel')}
          {user && navBtn('manage', 'Grupos')}
          
          <div className="border-l pl-4 border-slate-300 ml-2">
            {user ? (
              <button 
                onClick={onLogoutClick}
                className="flex items-center space-x-1 text-red-600 font-medium text-sm hover:text-red-800"
              >
                <IconUnlock /> <span>Salir</span>
              </button>
            ) : (
              <button 
                onClick={onLoginClick}
                className="flex items-center space-x-1 text-blue-600 font-medium text-sm hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-md border border-blue-200"
              >
                <IconLock /> <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// --- Componente: DashboardView ---
function DashboardView({ currentSessions, upcomingSessions, allSessions, groups, db, dataPath, user, onOpenLogin }) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Lógica para eliminar sesión
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta sesión? Se liberará el cupo.")) return;
    try {
      await deleteDoc(doc(db, `${dataPath}/sessions`, sessionId));
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const SessionCard = ({ session, isActive }) => (
    <div className={`relative p-4 rounded-lg border ${isActive ? 'bg-white border-l-4 border-l-green-500 shadow-md' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-800">{session.practiceName}</h3>
          <div className="text-sm text-slate-600 mt-1 space-y-1">
            <p className="flex items-center"><span className="font-semibold mr-1">Grupo:</span> {session.groupName}</p>
            <p className="flex items-center"><span className="font-semibold mr-1">Equipo:</span> {session.teamName}</p>
            <p className="flex items-center text-blue-600">
              <IconClock /> 
              <span className="ml-1">
                {session.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {session.endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </span>
            </p>
          </div>
        </div>
        {user && (
          <button 
            onClick={() => handleDeleteSession(session.id)}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
            title="Cancelar Sesión"
          >
            <IconTrash />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Estado Actual (8 columnas) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Banner de Estado */}
        <div className={`rounded-xl p-6 text-white shadow-lg ${currentSessions.length > 0 ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}>
          <h2 className="text-3xl font-bold mb-2">
            {currentSessions.length > 0 ? `Laboratorio Ocupado (${currentSessions.length} grupos)` : 'Laboratorio Disponible'}
          </h2>
          <p className="opacity-90">
            {currentSessions.length > 0 
              ? 'Hay prácticas en curso en este momento.' 
              : 'No hay sesiones activas. El laboratorio está libre para uso.'}
          </p>
        </div>

        {/* Lista de Sesiones Activas */}
        {currentSessions.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              En Curso Ahora
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSessions.map(s => <SessionCard key={s.id} session={s} isActive={true} />)}
            </div>
          </div>
        )}

        {/* Lista de Próximas */}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-3">Próximas Sesiones</h3>
          {upcomingSessions.length === 0 ? (
            <div className="text-slate-400 italic bg-white p-8 rounded-lg border border-dashed border-slate-300 text-center">
              No hay más sesiones programadas para hoy.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(s => <SessionCard key={s.id} session={s} isActive={false} />)}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Acciones (4 columnas) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-4 text-slate-800">Acciones Rápidas</h3>
          
          {user ? (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <div className="bg-white/20 p-1 rounded-md mr-3"><IconPlus /></div>
              Agendar Sesión
            </button>
          ) : (
            <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600 mb-3 text-sm">Necesitas permisos de administrador para agendar o gestionar el laboratorio.</p>
              <button 
                onClick={onOpenLogin}
                className="text-blue-600 font-semibold text-sm hover:underline"
              >
                Iniciar Sesión como Admin
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Reglas del Laboratorio</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start"><span className="mr-2 text-blue-500">•</span> Máximo 4 grupos simultáneos.</li>
              <li className="flex items-start"><span className="mr-2 text-blue-500">•</span> Duración máxima: 3 horas por sesión.</li>
              <li className="flex items-start"><span className="mr-2 text-blue-500">•</span> Cancelar con anticipación si no se usará.</li>
            </ul>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleSessionModal
          groups={groups}
          allSessions={allSessions} // Necesario para validar choques
          db={db}
          dataPath={dataPath}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
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
    e.preventDefault();
    if(!newGroupName || !newGroupLeader) return;
    
    setLoading(true);
    const members = newGroupMembers.split(',').map(m => m.trim()).filter(m => m);
    if (!members.includes(newGroupLeader)) members.unshift(newGroupLeader);

    await addDoc(collection(db, `${dataPath}/groups`), {
      name: newGroupName,
      leader: newGroupLeader,
      members: members
    });
    setNewGroupName(''); setNewGroupLeader(''); setNewGroupMembers('');
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(window.confirm("¿Eliminar grupo permanentemente?")) {
      await deleteDoc(doc(db, `${dataPath}/groups`, id));
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
        <h2 className="text-lg font-bold mb-4">Registrar Nuevo Grupo</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre del Grupo</label>
            <input 
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Ej. Redes II - 401"
              value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Líder del Grupo</label>
            <input 
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nombre del estudiante responsable"
              value={newGroupLeader} onChange={e => setNewGroupLeader(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Integrantes (separar por comas)</label>
            <textarea 
              className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              rows="3"
              placeholder="Juan, Maria, Pedro..."
              value={newGroupMembers} onChange={e => setNewGroupMembers(e.target.value)}
            />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300">
            {loading ? 'Guardando...' : 'Guardar Grupo'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700">Grupos Registrados ({groups.length})</h2>
        {groups.map(g => (
          <div key={g.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">{g.name}</h3>
              <p className="text-sm text-slate-500">Líder: {g.leader}</p>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{g.members?.join(', ')}</p>
            </div>
            <button onClick={() => handleDelete(g.id)} className="text-slate-400 hover:text-red-500 p-2">
              <IconTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Modal de Agendar (Con lógica de validación) ---
function ScheduleSessionModal({ groups, allSessions, db, dataPath, onClose }) {
  const [formData, setFormData] = useState({
    groupId: '', teamName: '', practiceName: '', startTime: '', endTime: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar fechas
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const startStr = now.toISOString().slice(0, 16);
    
    const end = new Date(now);
    end.setHours(end.getHours() + 2); // Default 2 horas
    const endStr = end.toISOString().slice(0, 16);

    setFormData(prev => ({ ...prev, startTime: startStr, endTime: endStr }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas
    if (!formData.groupId || !formData.practiceName) return setError("Faltan datos obligatorios.");
    
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (end <= start) return setError("La hora fin debe ser después del inicio.");

    // VALIDACIÓN 1: Duración Máxima (3 Horas)
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    if (durationHours > 3) {
      return setError("🚫 La sesión no puede durar más de 3 horas. Permitamos que otros grupos usen el lab.");
    }

    // VALIDACIÓN 2: Cupos (Máximo 4 sesiones simultáneas)
    // Filtramos sesiones que chocan con el horario propuesto
    const overlapping = allSessions.filter(s => {
      const sStart = s.startTime;
      const sEnd = s.endTime;
      // Fórmula de colisión de rangos: (InicioA < FinB) y (FinA > InicioB)
      return sStart < end && sEnd > start;
    });

    if (overlapping.length >= 4) {
      return setError(`🚫 No hay cupo. Ya hay 4 grupos agendados en ese horario.`);
    }

    setIsSubmitting(true);
    try {
      const group = groups.find(g => g.id === formData.groupId);
      await addDoc(collection(db, `${dataPath}/sessions`), {
        ...formData,
        groupName: group?.name || '?',
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end)
      });
      onClose();
    } catch (e) {
      setError("Error al guardar en base de datos.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h2 className="font-bold text-lg">Agendar Práctica</h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">{error}</div>}
          
          <div>
            <label className="text-sm font-semibold text-slate-700">Grupo</label>
            <select 
              className="w-full mt-1 p-2 border rounded-md bg-white"
              value={formData.groupId}
              onChange={e => setFormData({...formData, groupId: e.target.value})}
            >
              <option value="">Seleccionar Grupo...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Equipo</label>
              <input 
                className="w-full mt-1 p-2 border rounded-md" placeholder="Ej. Equipo Alpha"
                value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Nombre Práctica</label>
              <input 
                className="w-full mt-1 p-2 border rounded-md" placeholder="Ej. VLANs"
                value={formData.practiceName} onChange={e => setFormData({...formData, practiceName: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="text-xs uppercase font-bold text-slate-500">Inicio</label>
              <input 
                type="datetime-local" className="w-full mt-1 p-1 bg-transparent font-medium outline-none"
                value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-slate-500">Fin (Máx 3h)</label>
              <input 
                type="datetime-local" className="w-full mt-1 p-1 bg-transparent font-medium outline-none"
                value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700 disabled:bg-slate-400 mt-2">
            {isSubmitting ? 'Verificando cupos...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Auth Modal (Login/Registro) ---
function AuthModal({ auth, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(isRegister ? "Error al registrar. Verifica el correo o intenta otra contraseña." : "Credenciales incorrectas.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
          {isRegister ? 'Crear Administrador' : 'Acceso Administrador'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Correo Electrónico</label>
            <input 
              type="email" required className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@lab.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Contraseña</label>
            <input 
              type="password" required className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
          
          <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors">
            {loading ? 'Procesando...' : (isRegister ? 'Registrar' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Primer uso? Crea una cuenta de admin'}
          </button>
          <div className="mt-4">
            <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;