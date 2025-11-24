import React, { useState, useEffect, useMemo } from 'react';

// Importaciones de Firebase (¡Asegúrate de tener estas dependencias en tu proyecto!)
// Para este entorno, asumimos que están disponibles globalmente o importadas así:
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  Timestamp,
  setLogLevel
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from "firebase/auth";

// --- Iconos (usando lucide-react, pero aquí como componentes SVG para independencia) ---

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const IconFlask = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 3h6"></path><path d="M12 3v7c0 .6.4 1 1 1h.5c.6 0 1-.4 1-1V3"></path><path d="M12 13H6.09c-.5 0-.9.5-.8 1.1l.9 5.4c.1.5.5.9 1 .9h7.7c.5 0 1-.4 1-.9l.9-5.4c.1-.6-.2-1.1-.8-1.1H12Z"></path></svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

// --- Configuración de Firebase ---
// Estas variables DEBEN ser proporcionadas por el entorno de Canvas.
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
setLogLevel('debug');

// --- Componente Principal: App ---
function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' o 'manage'
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  // Estados de los datos
  const [groups, setGroups] = useState([]); // Lista de grupos del semestre
  const [sessions, setSessions] = useState([]); // Sesiones agendadas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efecto para autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
          if (token) {
            await signInWithCustomToken(auth, token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (authError) {
          console.error("Error de autenticación:", authError);
          setError("Error al autenticar. La aplicación no funcionará correctamente.");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Efecto para cargar datos (Grupos y Sesiones)
  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;

    setLoading(true);
    const paths = {
      groups: `artifacts/${appId}/users/${userId}/groups`,
      sessions: `artifacts/${appId}/users/${userId}/sessions`
    };

    console.log("Escuchando en:", paths.groups);
    console.log("Escuchando en:", paths.sessions);

    const unsubGroups = onSnapshot(query(collection(db, paths.groups)), (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);
    }, (err) => {
      console.error("Error al cargar grupos:", err);
      setError("Error al cargar grupos.");
    });

    const unsubSessions = onSnapshot(query(collection(db, paths.sessions)), (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convertir Timestamps de Firestore a objetos Date de JS
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate()
      }));
      setSessions(sessionsData);
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar sesiones:", err);
      setError("Error al cargar sesiones.");
      setLoading(false);
    });

    return () => {
      unsubGroups();
      unsubSessions();
    };
  }, [isAuthReady, userId, db]);
  
  // Memoizar cálculos de estado
  const { currentSessions, upcomingSessions } = useMemo(() => { // Renombrado
    const now = new Date();
    const sortedSessions = sessions
      .filter(s => s.endTime && s.endTime > now) // Solo sesiones futuras o activas
      .sort((a, b) => a.startTime - b.startTime);

    const currentSessions = sortedSessions.filter(s => s.startTime <= now && s.endTime > now); // Cambiado a filter
    const upcomingSessions = sortedSessions.filter(s => s.startTime > now);
    
    return { currentSessions, upcomingSessions }; // Retorna plural
  }, [sessions]);

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-700 p-4">{error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans antialiased">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* Contenido principal */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {!isAuthReady || loading ? (
          <div className="text-center text-gray-500">Cargando datos...</div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <DashboardView
                currentSessions={currentSessions} // Pasando el array
                upcomingSessions={upcomingSessions}
                groups={groups}
                db={db}
                userId={userId}
                appId={appId}
              />
            )}
            {currentView === 'manage' && (
              <ManageGroupsView
                groups={groups}
                db={db}
                userId={userId}
                appId={appId}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// --- Componente: Header ---
function Header({ currentView, setCurrentView }) {
  const navClass = (viewName) =>
    `py-2 px-4 rounded-lg font-medium transition-colors ${
      currentView === viewName
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">
          Laboratorio de Redes Infraestructura
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={navClass('dashboard')}
          >
            Panel Principal
          </button>
          <button
            onClick={() => setCurrentView('manage')}
            className={navClass('manage')}
          >
            Gestionar Grupos
          </button>
        </div>
      </nav>
    </header>
  );
}

// --- Componente: DashboardView ---
function DashboardView({ currentSessions, upcomingSessions, groups, db, userId, appId }) { // Prop renombrada
  const [showModal, setShowModal] = useState(false);

  // Formateador de tiempo
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date) => {
     if (!date) return 'N/A';
     return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  // Encontrar la hora de finalización más tardía de las sesiones actuales
  const latestEndTime = useMemo(() => {
    if (!currentSessions || currentSessions.length === 0) {
      return null;
    }
    // Encontrar la fecha (tiempo en ms) más grande
    const latestTimeMs = Math.max(...currentSessions.map(s => s.endTime.getTime()));
    return new Date(latestTimeMs);
  }, [currentSessions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Estado Actual */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Actualmente en Laboratorio
          </h2>
          {currentSessions && currentSessions.length > 0 ? ( // Comprobar si el array tiene elementos
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl font-bold text-red-700">
                  Ocupado
                </span>
                {latestEndTime && (
                  <span className="text-sm font-medium text-red-600 px-3 py-1 bg-red-100 rounded-full">
                    Última sesión termina a las {formatTime(latestEndTime)}
                  </span>
                )}
              </div>
              {/* Lista de sesiones activas */}
              <div className="space-y-4">
                {currentSessions.map(session => (
                  <div key={session.id} className="border-b border-red-100 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <IconFlask />
                      <span className="text-lg text-gray-700">
                        <span className="font-semibold">Práctica:</span> {session.practiceName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mb-2">
                      <IconUsers />
                      <span className="text-lg text-gray-700">
                        <span className="font-semibold">Grupo:</span> {session.groupName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <IconUsers className="text-gray-400" />
                      <span className="text-lg text-gray-700">
                        <span className="font-semibold">Equipo:</span> {session.teamName}
                      </span>
                    </div>
                     <div className="flex items-center space-x-3 mt-2">
                      <IconClock className="text-red-400" />
                      <span className="text-sm font-medium text-gray-600">
                        (Termina a las {formatTime(session.endTime)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
              <span className="text-2xl font-bold text-green-700">
                Laboratorio Libre
              </span>
              <p className="text-gray-600">No hay sesiones agendadas en este momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Agendar y Próximas */}
      <div className="space-y-6">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors"
        >
          <IconPlus className="mr-2" />
          Agendar Nueva Sesión
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Próximas Sesiones
          </h2>
          {upcomingSessions.length > 0 ? (
            <ul className="space-y-4">
              {upcomingSessions.slice(0, 5).map(session => (
                <li key={session.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <p className="font-semibold text-gray-700">{session.practiceName}</p>
                  <p className="text-sm text-gray-500">{session.groupName} - {session.teamName}</p>
                  <p className="text-sm text-blue-600 font-medium capitalize">
                    {formatDate(session.startTime)} ({formatTime(session.startTime)} - {formatTime(session.endTime)})
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay más sesiones agendadas.</p>
          )}
        </div>
      </div>

      {/* Modal para Agendar Sesión */}
      {showModal && (
        <ScheduleSessionModal
          groups={groups}
          db={db}
          userId={userId}
          appId={appId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// --- Componente: ManageGroupsView (Gestión de Grupos) ---
function ManageGroupsView({ groups, db, userId, appId }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLeader, setNewGroupLeader] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const groupsPath = `artifacts/${appId}/users/${userId}/groups`;

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupLeader.trim() || !newGroupMembers.trim()) {
      setError("El nombre, líder e integrantes son obligatorios.");
      return;
    }
    setError('');
    setLoading(true);

    const leaderName = newGroupLeader.trim();
    const membersArray = newGroupMembers
      .split(',')
      .map(m => m.trim()) // Limpia espacios
      .filter(m => m.length > 0); // Elimina entradas vacías

    // Asegurarse que el líder esté en la lista de miembros
    if (leaderName && !membersArray.includes(leaderName)) {
      membersArray.unshift(leaderName); // Agrega al inicio
    }

    try {
      await addDoc(collection(db, groupsPath), {
        name: newGroupName,
        leader: leaderName,
        members: membersArray
      });
      setNewGroupName('');
      setNewGroupLeader('');
      setNewGroupMembers('');
    } catch (err) {
      console.error("Error al agregar grupo:", err);
      setError("No se pudo agregar el grupo.");
    }
    setLoading(false);
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este grupo?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, groupsPath, groupId));
    } catch (err) {
      console.error("Error al eliminar grupo:", err);
      setError("No se pudo eliminar el grupo.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulario para agregar grupo */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Agregar Nuevo Grupo
        </h2>
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
              Nombre del Grupo (ej. "Grupo 301")
            </label>
            <input
              type="text"
              id="groupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Física 101"
            />
          </div>
          <div>
            <label htmlFor="leader" className="block text-sm font-medium text-gray-700">
              Líder de Grupo
            </label>
            <input
              type="text"
              id="leader"
              value={newGroupLeader}
              onChange={(e) => setNewGroupLeader(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Ana Méndez"
            />
          </div>
          <div>
            <label htmlFor="members" className="block text-sm font-medium text-gray-700">
              Integrantes (separados por coma)
            </label>
            <textarea
              id="members"
              value={newGroupMembers}
              onChange={(e) => setNewGroupMembers(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Ana Méndez, Juan Pérez, María López"
              rows="3"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Agregando..." : "Agregar Grupo"}
          </button>
        </form>
      </div>

      {/* Lista de grupos existentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Grupos Actuales
        </h2>
        {groups.length > 0 ? (
          <ul className="space-y-3">
            {groups.map(group => (
              <li key={group.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                <div>
                  <p className="font-medium text-gray-800">{group.name}</p>
                  <p className="text-sm text-gray-600 font-medium">Líder: {group.leader || 'N/A'}</p>
                  <p className="text-sm text-gray-500">
                    Integrantes: {group.members ? group.members.join(', ') : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                  title="Eliminar grupo"
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No hay grupos registrados. Agrega uno para empezar.</p>
        )}
      </div>
    </div>
  );
}

// --- Componente: ScheduleSessionModal (Modal para Agendar) ---
function ScheduleSessionModal({ groups, db, userId, appId, onClose }) {
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [teamName, setTeamName] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sessionsPath = `artifacts/${appId}/users/${userId}/sessions`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId || !teamName || !practiceName || !startTime || !endTime) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }
    
    setError('');
    setLoading(true);
    
    const selectedGroup = groups.find(g => g.id === groupId);

    try {
      await addDoc(collection(db, sessionsPath), {
        groupId: groupId,
        groupName: selectedGroup?.name || 'Grupo Desconocido',
        teamName: teamName,
        practiceName: practiceName,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
      });
      onClose(); // Cierra el modal al tener éxito
    } catch (err) {
      console.error("Error al agendar sesión:", err);
      setError("No se pudo agendar la sesión.");
    }
    setLoading(false);
  };

  // Obtener fecha y hora actual para el input (formato YYYY-MM-DDTHH:MM)
  const getLocalDateTime = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  }
  
  // Establecer valor por defecto al montar
  useEffect(() => {
    setStartTime(getLocalDateTime());
    
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 2); // Por defecto 2 horas de práctica
    setEndTime(getLocalDateTime(endDate));
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Agendar Sesión de Laboratorio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700">Grupo</label>
            <select
              id="group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="" disabled>Selecciona un grupo</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} (Líder: {g.leader || 'N/A'})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="team" className="block text-sm font-medium text-gray-700">Nombre del Equipo (ej. "Equipo 1")</label>
            <input
              type="text"
              id="team"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Equipo 1"
            />
          </div>

          <div>
            <label htmlFor="practice" className="block text-sm font-medium text-gray-700">Nombre de la Práctica</label>
            <input
              type="text"
              id="practice"
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Práctica 3: Titulación"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Inicio</label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
             <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Fin</label>
              <input
                type="datetime-local"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? "Agendando..." : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;