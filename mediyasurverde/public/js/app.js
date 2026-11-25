/*
 * MediYaSurVerde - Sistema multicanal de entrega domiciliaria de medicamentos
 * EPS Sura / Cruz Verde · Ingeniería de Software III · Grupo D
 *
 * Historias implementadas:
 *   HU-01 Inicio de sesión con rol (Firebase Authentication + perfil en Firestore)
 *   HU-02 Solicitar medicamentos (colección solicitudes en Firestore)
 *   HU-03 Ver solicitudes en tiempo real en el portal (onSnapshot)
 *   HU-04 Aprobar o rechazar solicitud con motivo
 *   HU-05 Consultar estado del pedido (solo solicitudes propias)
 * En el backlog: HU-06 Adjuntar fórmula médica, HU-07 Notificaciones, HU-08 Canal de WhatsApp real.
 *
 * El acceso a Firebase está en js/firebase-service.js (window.FB).
 */

/* ---------------- Portada de presentación ---------------- */

function enterPrototype(){
  const cover = document.getElementById('projectCover');
  const prototype = document.getElementById('prototypePage');
  if(cover) cover.classList.add('is-hidden');
  document.body.classList.remove('cover-active');
  window.scrollTo({top:0, behavior:'smooth'});
  setTimeout(()=>prototype?.focus({preventScroll:true}), 420);
}

/* ---------------- Text size toggle ---------------- */
function toggleText(){
  const phone = document.getElementById('phoneShell');
  const btn = document.getElementById('textToggle');
  if(!phone) return;
  const enabled = phone.classList.toggle('text-large');
  if(btn) btn.classList.toggle('on', enabled);
}

function toggleTextFromAccessibility(){
  toggleText();
  updateAccessibilityPanelState();
}

function toggleAccessibilityPanel(force){
  const panel = document.getElementById('accessibilityPanel');
  const fab = document.getElementById('accessibilityFab');
  if(!panel || !fab) return;
  const shouldOpen = typeof force === 'boolean' ? force : panel.hidden;
  panel.hidden = !shouldOpen;
  fab.classList.toggle('is-open', shouldOpen);
  fab.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  fab.setAttribute('aria-label', shouldOpen ? 'Cerrar opciones de accesibilidad' : 'Abrir opciones de accesibilidad');
  fab.setAttribute('title', shouldOpen ? 'Cerrar accesibilidad' : 'Accesibilidad');
}

function closeAccessibilityPanel(){
  toggleAccessibilityPanel(false);
}


function toggleHighContrast(){
  accessibilityState.highContrast = !accessibilityState.highContrast;
  applyAccessibilitySettings();
}

function applyAccessibilitySettings(){
  const html = document.documentElement;
  html.classList.toggle('high-contrast', accessibilityState.highContrast);
  updateAccessibilityPanelState();
}

function updateAccessibilityPanelState(){
  const phone = document.getElementById('phoneShell');
  const text = document.getElementById('textSizeState');
  const contrast = document.getElementById('contrastState');
  const speech = document.getElementById('speechState');
  const speechOption = document.getElementById('speechAccessibilityOption');
  const speechDescription = document.getElementById('speechAccessibilityDescription');

  if(text){
    const enabled = Boolean(phone?.classList.contains('text-large'));
    text.textContent = enabled ? 'On' : 'Off';
    text.classList.toggle('off', !enabled);
  }
  if(contrast){
    contrast.textContent = accessibilityState.highContrast ? 'On' : 'Off';
    contrast.classList.toggle('off', !accessibilityState.highContrast);
  }
  if(speech){
    speech.textContent = accessibilityState.isSpeaking ? 'Parar' : 'Leer';
    speech.classList.toggle('off', !accessibilityState.isSpeaking);
  }
  if(speechOption){
    speechOption.setAttribute('aria-pressed', accessibilityState.isSpeaking ? 'true' : 'false');
  }
  if(speechDescription){
    speechDescription.textContent = accessibilityState.isSpeaking
      ? 'La pantalla se está leyendo. Pulsa para detener.'
      : 'Lee en voz alta el contenido visible';
  }
}

function speechTextForCurrentScreen(){
  const content = document.getElementById('phoneContent');
  if(!content) return '';
  return content.innerText.replace(/\s+/g,' ').trim();
}

function stopScreenSpeech(){
  if('speechSynthesis' in window){
    window.speechSynthesis.cancel();
  }
  accessibilityState.isSpeaking = false;
  accessibilityState.utterance = null;
  updateAccessibilityPanelState();
}

function toggleSpeechCurrentScreen(){
  if(accessibilityState.isSpeaking){
    stopScreenSpeech();
    return;
  }

  const text = speechTextForCurrentScreen();
  if(!text) return;

  if(!('speechSynthesis' in window)){
    showPrototypeAlert('Tu navegador no permite lectura en voz alta en este prototipo.');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-CO';
  utterance.rate = 0.92;
  utterance.onstart = () => {
    accessibilityState.isSpeaking = true;
    updateAccessibilityPanelState();
  };
  utterance.onend = () => {
    accessibilityState.isSpeaking = false;
    accessibilityState.utterance = null;
    updateAccessibilityPanelState();
  };
  utterance.onerror = () => {
    accessibilityState.isSpeaking = false;
    accessibilityState.utterance = null;
    updateAccessibilityPanelState();
  };

  accessibilityState.utterance = utterance;
  accessibilityState.isSpeaking = true;
  updateAccessibilityPanelState();
  window.speechSynthesis.speak(utterance);
}


/* ---------------- Alertas internas del prototipo ---------------- */
let prototypeAlertReturnFocus = null;

function showPrototypeAlert(message, options = {}){
  const config = typeof options === 'string' ? {title:options} : options;
  const title = config.title || 'Aviso';
  const requestedFocus = config.returnFocus
    ? document.querySelector(config.returnFocus)
    : document.activeElement;
  prototypeAlertReturnFocus = requestedFocus instanceof HTMLElement ? requestedFocus : null;

  const mobileIsActive = document.getElementById('mobile-view')?.classList.contains('active');
  if(mobileIsActive){
    const layer = document.getElementById('mobilePrototypeAlertLayer');
    const titleElement = document.getElementById('mobilePrototypeAlertTitle');
    const messageElement = document.getElementById('mobilePrototypeAlertMessage');
    const button = document.getElementById('mobilePrototypeAlertButton');
    if(!layer || !titleElement || !messageElement) return;
    titleElement.textContent = title;
    messageElement.textContent = String(message || '');
    layer.classList.add('active');
    layer.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>button?.focus());
    return;
  }

  const overlay = document.getElementById('prototypeAlertOverlay');
  const titleElement = document.getElementById('prototypeAlertTitle');
  const messageElement = document.getElementById('prototypeAlertMessage');
  const button = document.getElementById('prototypeAlertButton');
  if(!overlay || !titleElement || !messageElement) return;
  titleElement.textContent = title;
  messageElement.textContent = String(message || '');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>button?.focus());
}

function closePrototypeAlert(){
  const mobileLayer = document.getElementById('mobilePrototypeAlertLayer');
  const portalOverlay = document.getElementById('prototypeAlertOverlay');
  mobileLayer?.classList.remove('active');
  mobileLayer?.setAttribute('aria-hidden','true');
  portalOverlay?.classList.remove('active');
  portalOverlay?.setAttribute('aria-hidden','true');

  const focusTarget = prototypeAlertReturnFocus;
  prototypeAlertReturnFocus = null;
  if(focusTarget?.isConnected){
    requestAnimationFrame(()=>focusTarget.focus());
  }
}

function handlePrototypeAlertBackdrop(event){
  if(event.target.id === 'mobilePrototypeAlertLayer' || event.target.id === 'prototypeAlertOverlay') closePrototypeAlert();
}

/* ---------------- View switch ---------------- */
function switchView(btn){
  document.querySelectorAll('.switch button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(btn.dataset.view).classList.add('active');
  if(btn.dataset.view === 'web-view') renderPortalAccess();
}


/* ---------------- Conexión con Firebase ---------------- */
function whenFirebaseReady(){
  if(window.FB) return Promise.resolve(window.FB);
  if(window.FB_LOAD_ERROR) return Promise.reject(Object.assign(new Error('red'), {code:'red'}));
  return new Promise((resolve, reject) => {
    window.addEventListener('fb-ready', () => resolve(window.FB), {once:true});
    window.addEventListener('fb-error', () => reject(Object.assign(new Error('red'), {code:'red'})), {once:true});
  });
}

function firebaseErrorMessage(error){
  const code = error?.code || '';
  if(code === 'no-configurado') return 'Firebase no está configurado. Complete los datos del archivo js/firebase-config.js.';
  if(code === 'credenciales') return 'Datos de acceso incorrectos. Verifica la información e inténtalo de nuevo.';
  if(code === 'inactivo') return 'Tu usuario no está habilitado. Comunícate con la línea de atención de EPS Sura.';
  if(code === 'rol') return 'Este usuario no tiene permisos para ingresar a esta opción.';
  if(code === 'red' || code === 'unavailable') return 'No hay conexión con el servidor. Revisa tu conexión a internet.';
  if(code === 'bloqueado-temporal') return 'Se bloquearon temporalmente los intentos de ingreso. Intenta de nuevo en unos minutos.';
  if(code === 'permission-denied') return 'No tienes permisos para realizar esta acción.';
  return 'No fue posible completar la operación. Inténtalo de nuevo.';
}

function setButtonBusy(button, busy, label = 'Procesando...'){
  if(!button) return;
  if(busy){
    if(!button.dataset.idleHtml) button.dataset.idleHtml = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy','true');
    button.innerHTML = `<span>${label}</span>`;
  }else{
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if(button.dataset.idleHtml){
      button.innerHTML = button.dataset.idleHtml;
      delete button.dataset.idleHtml;
    }
  }
}

function formatDateTimeShort(ms, withSeconds = false){
  if(!ms) return 'Registrando...';
  return new Intl.DateTimeFormat('es-CO', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'numeric', minute:'2-digit', ...(withSeconds ? {second:'2-digit'} : {})
  }).format(new Date(ms));
}

function formatDateShort(ms){
  if(!ms) return 'Hoy';
  return new Intl.DateTimeFormat('es-CO', {day:'2-digit', month:'2-digit', year:'numeric'}).format(new Date(ms));
}

/* ---------------- Mobile app state ---------------- */
const medsCatalog = [
  {id:'m1', name:'Losartán 50mg', meta:'Formulado · 30 tabletas'},
  {id:'m2', name:'Metformina 850mg', meta:'Formulado · 60 tabletas'},
  {id:'m3', name:'Atorvastatina 20mg', meta:'Formulado · 30 tabletas'},
];
let order = { meds:[], deliveryDate:'' };
let isAuthenticated = false;
let currentScreen = 'login';
const accessibilityState = { highContrast:false, isSpeaking:false, utterance:null };

// HU-05: solicitudes del paciente leídas desde Firestore
let patientRequests = [];
let patientRequestsLoaded = false;
let patientRequestsError = '';
let unsubscribePatientRequests = null;
let openMobileRequestId = null;

const requestStatusLabels = {
  pendiente:'Pendiente',
  aprobada:'Aprobada',
  rechazada:'Rechazada'
};

function patientProfile(){
  return window.FB?.perfil('paciente') || {};
}

function savedPatientAddress(){
  return patientProfile().direccion || '';
}

function startPatientRequestsListener(){
  stopPatientRequestsListener();
  patientRequests = [];
  patientRequestsLoaded = false;
  patientRequestsError = '';
  try{
    unsubscribePatientRequests = window.FB.escucharSolicitudesPaciente(items => {
      patientRequests = items;
      patientRequestsLoaded = true;
      patientRequestsError = '';
      refreshPatientViews();
    }, error => {
      console.error(error);
      patientRequestsLoaded = true;
      patientRequestsError = firebaseErrorMessage(error);
      refreshPatientViews();
    });
  }catch(error){
    patientRequestsLoaded = true;
    patientRequestsError = firebaseErrorMessage(error);
  }
}

function stopPatientRequestsListener(){
  if(typeof unsubscribePatientRequests === 'function') unsubscribePatientRequests();
  unsubscribePatientRequests = null;
}

function refreshPatientViews(){
  if(!isAuthenticated) return;
  if(currentScreen === 'track'){
    const el = document.getElementById('phoneContent');
    const scroll = el?.scrollTop || 0;
    if(el){
      el.innerHTML = screenTrack();
      el.scrollTop = scroll;
    }
  }
  if(openMobileRequestId) openMobileOrderModal(openMobileRequestId);
}

function renderScreen(name, btn){
  closeMobileOrderModal();
  if(name !== 'login' && !isAuthenticated){
    name = 'login';
  }
  currentScreen = name;
  closeAccessibilityPanel();
  if('speechSynthesis' in window) window.speechSynthesis.cancel();
  const nav = document.getElementById('phoneNav');
  const screen = document.querySelector('.phone-screen');
  nav.classList.toggle('hidden', name === 'login');
  if(screen) screen.classList.toggle('no-nav', name === 'login');
  if(btn){
    document.querySelectorAll('#phoneNav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  const el = document.getElementById('phoneContent');
  el.classList.toggle('scrollable-screen', name === 'profile' || name === 'track' || name === 'request' || name === 'help');
  el.scrollTop = 0;
  if(name === 'login') el.innerHTML = screenLogin();
  if(name === 'home') el.innerHTML = screenHome();
  if(name === 'request'){
    el.innerHTML = screenRequest();
    initializeLocationSelects();
  }
  if(name === 'track') el.innerHTML = screenTrack();
  if(name === 'help') el.innerHTML = screenHelp();
  if(name === 'profile') el.innerHTML = screenProfile();
  updateAccessibilityPanelState();
}

/* ---------------- HU-01: inicio de sesión del paciente ---------------- */
function screenLogin(){
  return `
    <div style="padding:.25rem 0 .1rem;">
      <img class="login-logo" src="assets/logo.png" alt="Logo MediYaSurVerde">
      <p class="greeting" style="text-align:center; margin-bottom:1rem;">Iniciar sesión<span>Ingresa tus datos para continuar</span></p>
      <form class="login-card" onsubmit="submitLogin(event)" novalidate>
        <div class="form-field">
          <label for="documentType">Tipo de documento</label>
          <select id="documentType" class="form-control" required>
            <option value="">Selecciona una opción</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="RC">Registro civil</option>
            <option value="PA">Pasaporte</option>
            <option value="PEP">Permiso especial de permanencia</option>
            <option value="PPT">Permiso por protección temporal</option>
          </select>
        </div>
        <div class="form-field">
          <label for="documentNumber">Número de documento</label>
          <input id="documentNumber" class="form-control" type="text" inputmode="numeric"
                 autocomplete="username" placeholder="Ingresa tu número" maxlength="15"
                 oninput="this.value=this.value.replace(/\\D/g,'')" required>
        </div>
        <div class="form-field">
          <label for="loginPin">Contraseña</label>
          <input id="loginPin" class="form-control" type="password"
                 autocomplete="current-password" placeholder="Mínimo 6 caracteres" minlength="6" maxlength="64" required>
        </div>
        <div id="loginError" class="login-error" role="alert"></div>
        <button class="big-btn primary" type="submit" style="margin-bottom:0; justify-content:center;"><span>Ingresar</span>
        </button>
      </form>
    </div>
  `;
}

function showLoginError(message, focusSelector){
  const error = document.getElementById('loginError');
  if(error){
    error.textContent = message;
    error.classList.add('show');
  }
  showPrototypeAlert(message, {returnFocus:focusSelector || '#loginPin'});
}

async function submitLogin(event){
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const type = document.getElementById('documentType').value;
  const documentNumber = document.getElementById('documentNumber').value.trim();
  const password = document.getElementById('loginPin').value;
  const error = document.getElementById('loginError');

  if(!type || !documentNumber || !password){
    const missing = !type ? '#documentType' : (!documentNumber ? '#documentNumber' : '#loginPin');
    showLoginError('Completa todos los campos para ingresar.', missing);
    return;
  }
  if(password.length < 6){
    showLoginError('La contraseña debe tener al menos 6 caracteres.', '#loginPin');
    return;
  }

  setButtonBusy(button, true, 'Validando...');
  try{
    const FB = await whenFirebaseReady();
    await FB.loginPaciente(type, documentNumber, password);
  }catch(loginError){
    setButtonBusy(button, false);
    showLoginError(firebaseErrorMessage(loginError), '#loginPin');
    return;
  }
  setButtonBusy(button, false);
  error?.classList.remove('show');
  isAuthenticated = true;
  startPatientRequestsListener();
  setNav('home');
  renderScreen('home');
}

function appScreenHeader(title, subtitle){
  return `
    <div class="screen-topbar">
      <div class="screen-topbar-copy">
        <span class="screen-topbar-title">${title}</span>
        <span class="screen-topbar-subtitle">${subtitle}</span>
      </div>
    </div>`;
}

function screenHome(){
  const firstName = escapeOptionText(String(patientProfile().nombre || '').split(' ')[0] || '');
  return `
    ${appScreenHeader(`Hola${firstName ? `, ${firstName}` : ''} 👋`,'¿Qué necesitas hacer hoy?')}
    <button class="big-btn action-card" onclick="renderScreen('request')">
      <span class="action-card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M8.2 5.2a4.25 4.25 0 0 1 6 0l4.6 4.6a4.25 4.25 0 0 1-6 6l-4.6-4.6a4.25 4.25 0 0 1 0-6Z"></path><path d="m9.3 12.3 6-6"></path></svg>
      </span>
      <span class="action-card-copy"><span class="action-card-title">Pedir mis medicamentos</span><small>Solicita tu entrega a domicilio</small></span>
    </button>
    <button class="big-btn action-card" onclick="renderScreen('track'); setNav('track')">
      <span class="action-card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"></path><path d="M4 7.5 12 12l8-4.5"></path><path d="M12 12v9"></path></svg>
      </span>
      <span class="action-card-copy"><span class="action-card-title">Consultar mis pedidos</span><small>Revisa si tu solicitud fue aprobada o rechazada</small></span>
    </button>
  `;
}

function setNav(key){
  document.querySelectorAll('#phoneNav button').forEach(b=>{
    b.classList.toggle('active', b.dataset.screen === key);
  });
}


function getLocalTodayISO(){
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60000).toISOString().split('T')[0];
}

function screenRequest(){
  const rows = medsCatalog.map(m => `
    <label class="check-row">
      <input type="checkbox" value="${m.id}" ${order.meds.includes(m.id) ? 'checked':''}>
      <span>${m.name}<span class="meta"> — ${m.meta}</span></span>
    </label>
  `).join('');
  return `
    ${appScreenHeader('Pedir mis medicamentos','Selecciona los medicamentos y la dirección de entrega')}
    <button class="back-link" type="button" onclick="renderScreen('home'); setNav('home')">Volver</button>
    <form id="medicationRequestForm" class="request-form" onsubmit="event.preventDefault(); confirmSelection();">
    <div class="request-section-title">Medicamentos autorizados:</div>
    <div class="card">${rows}</div>
    <div class="card address-card">
      <div class="request-section-title">Dirección de entrega</div>
      <div class="form-field">
        <label id="deliveryAddressLabel">Selecciona una dirección</label>
        <div class="contained-select" id="deliveryAddressPicker">
          <button class="contained-select-trigger" type="button" onclick="toggleDeliveryAddressSelect()"
                  aria-haspopup="listbox" aria-expanded="false" aria-labelledby="deliveryAddressLabel deliveryAddressText">
            <span id="deliveryAddressText">${escapeOptionText(savedPatientAddress() || 'Escribir una nueva dirección')}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <input id="deliveryAddressSelect" type="hidden" value="${savedPatientAddress() ? 'saved' : 'new'}">
          <div class="contained-select-menu" id="deliveryAddressMenu" hidden role="listbox" aria-label="Direcciones de entrega">
            <div class="contained-select-options address-options">
              ${savedPatientAddress() ? `
              <button class="contained-select-option" type="button" role="option" aria-selected="true"
                      onclick="selectDeliveryAddress('saved',null,this)">
                ${escapeOptionText(savedPatientAddress())}
              </button>` : ''}
              <button class="contained-select-option" type="button" role="option" ${savedPatientAddress() ? '' : 'aria-selected="true"'}
                      onclick="selectDeliveryAddress('new','Escribir una nueva dirección',this)">
                Escribir una nueva dirección
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id="newAddressField" class="new-address-field" ${savedPatientAddress() ? 'hidden' : ''}>
        <div class="form-field">
          <label id="newDeliveryCityLabel">Ciudad</label>
          <div class="contained-select" id="newDeliveryCityPicker">
            <button class="contained-select-trigger" type="button" onclick="toggleContainedSelect('city')"
                    aria-haspopup="listbox" aria-expanded="false" aria-labelledby="newDeliveryCityLabel newDeliveryCityText">
              <span id="newDeliveryCityText">Cargando ciudades...</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
            </button>
            <input id="newDeliveryCity" type="hidden" value="">
            <div class="contained-select-menu" id="newDeliveryCityMenu" hidden>
              <input class="contained-select-search" id="newDeliveryCitySearch" type="search"
                     placeholder="Buscar ciudad" autocomplete="off"
                     oninput="filterContainedSelect('city', this.value)">
              <div class="contained-select-options" id="newDeliveryCityOptions" role="listbox" aria-label="Ciudades"></div>
            </div>
          </div>
        </div>
        <div class="form-field">
          <label id="newDeliveryMunicipalityLabel">Municipio</label>
          <div class="contained-select" id="newDeliveryMunicipalityPicker">
            <button class="contained-select-trigger" type="button" onclick="toggleContainedSelect('municipality')"
                    aria-haspopup="listbox" aria-expanded="false" aria-labelledby="newDeliveryMunicipalityLabel newDeliveryMunicipalityText">
              <span id="newDeliveryMunicipalityText">Cargando municipios...</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
            </button>
            <input id="newDeliveryMunicipality" type="hidden" value="">
            <div class="contained-select-menu" id="newDeliveryMunicipalityMenu" hidden>
              <input class="contained-select-search" id="newDeliveryMunicipalitySearch" type="search"
                     placeholder="Buscar municipio" autocomplete="off"
                     oninput="filterContainedSelect('municipality', this.value)">
              <div class="contained-select-options" id="newDeliveryMunicipalityOptions" role="listbox" aria-label="Municipios"></div>
            </div>
          </div>
        </div>
        <div class="form-field">
          <label for="newDeliveryAddress">Dirección</label>
          <input id="newDeliveryAddress" class="form-control" type="text" maxlength="100" placeholder="Ej. Cra 45 # 12-30" autocomplete="street-address">
        </div>
        <div class="form-field">
          <label for="newDeliveryNeighborhood">Barrio</label>
          <input id="newDeliveryNeighborhood" class="form-control" type="text" maxlength="70" placeholder="Ej. San Fernando" autocomplete="address-level3">
        </div>
        <div class="form-field">
          <label for="newDeliveryDetails">Información complementaria <span style="font-weight:400; color:var(--text-muted);">(opcional)</span></label>
          <textarea id="newDeliveryDetails" class="form-control" maxlength="180" placeholder="Apartamento, torre, punto de referencia o indicaciones de entrega"></textarea>
        </div>
      </div>
    </div>
    <div class="card delivery-date-card">
      <div class="request-section-title">Fecha deseada de entrega</div>
      <div class="form-field" style="margin-bottom:0;">
        <label for="desiredDeliveryDate">Selecciona una fecha</label>
        <input id="desiredDeliveryDate" class="form-control" type="date"
               min="${getLocalTodayISO()}" value="${order.deliveryDate || ''}" required>
      </div>
    </div>
    <div class="request-submit-row">
      <button class="big-btn primary request-submit-btn" type="submit">Confirmar solicitud</button>
    </div>
    </form>
  `;
}

const COLOMBIA_LOCATIONS_ENDPOINT = 'https://www.datos.gov.co/resource/82di-kkh9.json?$select=dpto,nom_mpio&$limit=5000&$order=nom_mpio';
let colombiaLocationsCache = null;

const colombiaLocationsFallback = [
  {dpto:'Antioquia', nom_mpio:'Medellín'},
  {dpto:'Atlántico', nom_mpio:'Barranquilla'},
  {dpto:'Bogotá, D.C.', nom_mpio:'Bogotá, D.C.'},
  {dpto:'Bolívar', nom_mpio:'Cartagena de Indias'},
  {dpto:'Boyacá', nom_mpio:'Tunja'},
  {dpto:'Caldas', nom_mpio:'Manizales'},
  {dpto:'Caquetá', nom_mpio:'Florencia'},
  {dpto:'Casanare', nom_mpio:'Yopal'},
  {dpto:'Cauca', nom_mpio:'Popayán'},
  {dpto:'Cesar', nom_mpio:'Valledupar'},
  {dpto:'Chocó', nom_mpio:'Quibdó'},
  {dpto:'Córdoba', nom_mpio:'Montería'},
  {dpto:'Cundinamarca', nom_mpio:'Soacha'},
  {dpto:'Huila', nom_mpio:'Neiva'},
  {dpto:'La Guajira', nom_mpio:'Riohacha'},
  {dpto:'Magdalena', nom_mpio:'Santa Marta'},
  {dpto:'Meta', nom_mpio:'Villavicencio'},
  {dpto:'Nariño', nom_mpio:'Pasto'},
  {dpto:'Norte de Santander', nom_mpio:'Cúcuta'},
  {dpto:'Quindío', nom_mpio:'Armenia'},
  {dpto:'Risaralda', nom_mpio:'Pereira'},
  {dpto:'Santander', nom_mpio:'Bucaramanga'},
  {dpto:'Sucre', nom_mpio:'Sincelejo'},
  {dpto:'Tolima', nom_mpio:'Ibagué'},
  {dpto:'Valle del Cauca', nom_mpio:'Cali'},
  {dpto:'Valle del Cauca', nom_mpio:'Buenaventura'},
  {dpto:'Valle del Cauca', nom_mpio:'Jamundí'},
  {dpto:'Valle del Cauca', nom_mpio:'Palmira'}
];

function escapeOptionText(value){
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function getColombiaLocations(){
  if(colombiaLocationsCache) return colombiaLocationsCache;

  try{
    const response = await fetch(COLOMBIA_LOCATIONS_ENDPOINT, {headers:{Accept:'application/json'}});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const cleaned = data
      .filter(item => item && item.nom_mpio)
      .map(item => ({
        dpto: String(item.dpto || '').trim(),
        nom_mpio: String(item.nom_mpio || '').trim()
      }))
      .filter(item => item.nom_mpio);
    if(!cleaned.length) throw new Error('El servicio no devolvió ubicaciones.');
    colombiaLocationsCache = cleaned;
  }catch(error){
    console.warn('No fue posible cargar el listado completo de ubicaciones; se usará la lista de respaldo.', error);
    colombiaLocationsCache = colombiaLocationsFallback;
  }

  return colombiaLocationsCache;
}

function normalizedLocationOptions(locations){
  const unique = new Map();
  locations.forEach(location => {
    const key = `${location.nom_mpio}|${location.dpto}`;
    if(!unique.has(key)) unique.set(key, location);
  });

  return [...unique.values()].sort((a,b) =>
    a.nom_mpio.localeCompare(b.nom_mpio, 'es', {sensitivity:'base'}) ||
    a.dpto.localeCompare(b.dpto, 'es', {sensitivity:'base'})
  );
}

let containedLocationOptions = [];

function pickerElements(kind){
  const isCity = kind === 'city';
  const prefix = isCity ? 'newDeliveryCity' : 'newDeliveryMunicipality';
  return {
    picker: document.getElementById(`${prefix}Picker`),
    menu: document.getElementById(`${prefix}Menu`),
    trigger: document.querySelector(`#${prefix}Picker .contained-select-trigger`),
    text: document.getElementById(`${prefix}Text`),
    input: document.getElementById(prefix),
    search: document.getElementById(`${prefix}Search`),
    options: document.getElementById(`${prefix}Options`)
  };
}

function closeContainedSelect(kind){
  const elements = pickerElements(kind);
  if(!elements.menu) return;
  elements.menu.hidden = true;
  elements.picker?.classList.remove('open');
  elements.trigger?.setAttribute('aria-expanded','false');
}

function toggleContainedSelect(kind){
  const elements = pickerElements(kind);
  if(!elements.menu || !containedLocationOptions.length) return;

  const shouldOpen = elements.menu.hidden;
  closeContainedSelect(kind === 'city' ? 'municipality' : 'city');
  elements.menu.hidden = !shouldOpen;
  elements.picker?.classList.toggle('open', shouldOpen);
  elements.trigger?.setAttribute('aria-expanded', String(shouldOpen));

  if(shouldOpen){
    elements.search.value = '';
    renderContainedSelectOptions(kind, '');
    requestAnimationFrame(() => elements.search?.focus());
  }
}

function renderContainedSelectOptions(kind, query=''){
  const elements = pickerElements(kind);
  if(!elements.options) return;

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const matches = containedLocationOptions.filter(location => {
    const searchable = `${location.nom_mpio} ${location.dpto}`.toLocaleLowerCase('es');
    return !normalizedQuery || searchable.includes(normalizedQuery);
  });

  if(!matches.length){
    elements.options.innerHTML = '<div class="contained-select-empty">No se encontraron resultados.</div>';
    return;
  }

  elements.options.innerHTML = matches.map(location => {
    const encodedValue = encodeURIComponent(location.nom_mpio);
    const encodedDepartment = encodeURIComponent(location.dpto || '');
    const label = `${escapeOptionText(location.nom_mpio)}${location.dpto ? ` — ${escapeOptionText(location.dpto)}` : ''}`;
    return `<button class="contained-select-option" type="button" role="option"
                    onclick="selectContainedLocation('${kind}','${encodedValue}','${encodedDepartment}',this)">${label}</button>`;
  }).join('');
}

function filterContainedSelect(kind, query){
  renderContainedSelectOptions(kind, query);
}

function selectContainedLocation(kind, encodedValue, encodedDepartment, optionButton){
  const value = decodeURIComponent(encodedValue);
  const department = decodeURIComponent(encodedDepartment);
  const elements = pickerElements(kind);
  if(!elements.input || !elements.text) return;

  elements.input.value = value;
  elements.input.dataset.department = department;
  elements.text.textContent = department ? `${value} — ${department}` : value;
  elements.options?.querySelectorAll('[aria-selected="true"]').forEach(option => option.removeAttribute('aria-selected'));
  optionButton?.setAttribute('aria-selected','true');
  closeContainedSelect(kind);
  elements.trigger?.focus();
}

async function initializeLocationSelects(){
  const cityText = document.getElementById('newDeliveryCityText');
  const municipalityText = document.getElementById('newDeliveryMunicipalityText');
  if(!cityText || !municipalityText) return;

  const locations = await getColombiaLocations();
  containedLocationOptions = normalizedLocationOptions(locations);

  const currentCityText = document.getElementById('newDeliveryCityText');
  const currentMunicipalityText = document.getElementById('newDeliveryMunicipalityText');
  if(!currentCityText || !currentMunicipalityText) return;

  currentCityText.textContent = 'Selecciona una ciudad';
  currentMunicipalityText.textContent = 'Selecciona un municipio';
  renderContainedSelectOptions('city');
  renderContainedSelectOptions('municipality');
}

function toggleDeliveryAddressSelect(){
  const picker = document.getElementById('deliveryAddressPicker');
  const menu = document.getElementById('deliveryAddressMenu');
  const trigger = picker?.querySelector('.contained-select-trigger');
  if(!picker || !menu || !trigger) return;

  closeContainedSelect('city');
  closeContainedSelect('municipality');
  const shouldOpen = menu.hidden;
  menu.hidden = !shouldOpen;
  picker.classList.toggle('open', shouldOpen);
  trigger.setAttribute('aria-expanded', String(shouldOpen));
}

function closeDeliveryAddressSelect(){
  const picker = document.getElementById('deliveryAddressPicker');
  const menu = document.getElementById('deliveryAddressMenu');
  const trigger = picker?.querySelector('.contained-select-trigger');
  if(!picker || !menu || !trigger) return;
  menu.hidden = true;
  picker.classList.remove('open');
  trigger.setAttribute('aria-expanded','false');
}

function selectDeliveryAddress(value, label, optionButton){
  const input = document.getElementById('deliveryAddressSelect');
  const text = document.getElementById('deliveryAddressText');
  const options = document.querySelectorAll('#deliveryAddressMenu [role="option"]');
  if(!input || !text) return;

  input.value = value;
  text.textContent = label ?? optionButton?.textContent.trim() ?? '';
  options.forEach(option => option.removeAttribute('aria-selected'));
  optionButton?.setAttribute('aria-selected','true');
  closeDeliveryAddressSelect();
  toggleNewAddressField();
  document.querySelector('#deliveryAddressPicker .contained-select-trigger')?.focus();
}

function toggleNewAddressField(){
  const select = document.getElementById('deliveryAddressSelect');
  const field = document.getElementById('newAddressField');
  if(!select || !field) return;

  const shouldShow = select.value === 'new';
  field.hidden = !shouldShow;
  closeDeliveryAddressSelect();
  if(!shouldShow){
    closeContainedSelect('city');
    closeContainedSelect('municipality');
  }
  if(shouldShow){
    document.querySelector('#newDeliveryCityPicker .contained-select-trigger')?.focus();
  }
}


/* ---------------- HU-02: enviar la solicitud a Firestore ---------------- */
async function confirmSelection(){
  const form = document.getElementById('medicationRequestForm');
  const button = form?.querySelector('button[type="submit"]');
  if(button?.disabled) return;
  const checked = [...document.querySelectorAll('#phoneContent input[type=checkbox]:checked')].map(i=>i.value);
  const addressSelect = document.getElementById('deliveryAddressSelect');
  const deliveryDateInput = document.getElementById('desiredDeliveryDate');
  const deliveryDate = deliveryDateInput?.value || '';
  let selectedAddress = addressSelect?.value || '';

  if(!checked.length){
    showPrototypeAlert('Selecciona al menos un medicamento.', {returnFocus:'#phoneContent input[type=checkbox]'});
    return;
  }
  if(!deliveryDate){
    showPrototypeAlert('Selecciona la fecha deseada de entrega.', {returnFocus:'#desiredDeliveryDate'});
    return;
  }
  if(deliveryDate < getLocalTodayISO()){
    showPrototypeAlert('La fecha de entrega no puede ser anterior a hoy.', {returnFocus:'#desiredDeliveryDate'});
    return;
  }
  if(selectedAddress === 'saved'){
    selectedAddress = savedPatientAddress();
  }else if(selectedAddress === 'new'){
    const city = document.getElementById('newDeliveryCity')?.value.trim() || '';
    const municipality = document.getElementById('newDeliveryMunicipality')?.value.trim() || '';
    const address = document.getElementById('newDeliveryAddress')?.value.trim() || '';
    const neighborhood = document.getElementById('newDeliveryNeighborhood')?.value.trim() || '';
    const details = document.getElementById('newDeliveryDetails')?.value.trim() || '';
    const requiredFields = [
      {value:city, focus:'#newDeliveryCityPicker .contained-select-trigger', message:'Selecciona una ciudad.'},
      {value:municipality, focus:'#newDeliveryMunicipalityPicker .contained-select-trigger', message:'Selecciona un municipio.'},
      {value:address, focus:'#newDeliveryAddress', message:'Ingresa la dirección.'},
      {value:neighborhood, focus:'#newDeliveryNeighborhood', message:'Ingresa el barrio.'}
    ];
    const missingField = requiredFields.find(field => !field.value);
    if(missingField){
      showPrototypeAlert(missingField.message, {returnFocus:missingField.focus});
      return;
    }
    const locationText = municipality === city ? city : `${municipality}, ${city}`;
    selectedAddress = `${address}, Barrio ${neighborhood}, ${locationText}${details ? ` · ${details}` : ''}`;
  }
  if(!selectedAddress){
    showPrototypeAlert('Selecciona o escribe una dirección de entrega.', {returnFocus:'#deliveryAddressPicker .contained-select-trigger'});
    return;
  }

  const medicamentos = checked.map(id => medsCatalog.find(m => m.id === id)?.name).filter(Boolean);
  order.meds = checked;
  order.deliveryDate = deliveryDate;

  setButtonBusy(button, true, 'Enviando solicitud...');
  try{
    await window.FB.crearSolicitudPaciente({ medicamentos, direccion:selectedAddress, fechaEntrega:deliveryDate });
  }catch(error){
    console.error(error);
    setButtonBusy(button, false);
    showPrototypeAlert(firebaseErrorMessage(error), {title:'No se pudo enviar'});
    return;
  }
  setButtonBusy(button, false);
  order = { meds:[], deliveryDate:'' };
  openRequestSuccessModal();
}

function openRequestSuccessModal(){
  const layer = document.getElementById('mobileModalLayer');
  const modal = document.getElementById('mobileModalBody');
  if(!layer || !modal) return;

  closeDeliveryAddressSelect();
  closeContainedSelect('city');
  closeContainedSelect('municipality');

  modal.innerHTML = `
    <div class="mobile-modal-header">
      <h3>Solicitud enviada</h3>
      <button class="mobile-modal-close" type="button" onclick="closeMobileOrderModal()" aria-label="Cerrar">✕</button>
    </div>
    <div class="request-success-content">
      <div class="request-success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.6 2.6L16.5 9"></path></svg>
      </div>
      <p class="request-success-title">¡Solicitud enviada!</p>
      <p class="request-success-copy">Cruz Verde revisará tu solicitud. Consulta en “Mis pedidos” si fue aprobada o rechazada.</p>
      <button class="big-btn primary request-success-btn" type="button" onclick="goToOrdersFromSuccess()">Ver mis pedidos</button>
    </div>
  `;
  layer.classList.add('active');
  layer.setAttribute('aria-hidden','false');
}

function goToOrdersFromSuccess(){
  closeMobileOrderModal();
  setNav('track');
  renderScreen('track');
}

/* ---------------- HU-05: consultar el estado de las solicitudes ---------------- */
function mobileStatusLabel(status){
  return requestStatusLabels[status] || status;
}

function mobileOrderRows(requests){
  return requests.map(request => `
    <tr>
      <td>${formatDateShort(request.creadaEn)}</td>
      <td>
        <button class="view-order-btn" type="button" onclick="openMobileOrderModal('${request.id}')"
                aria-label="Ver solicitud del ${formatDateShort(request.creadaEn)}" title="Ver solicitud">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.7"></circle></svg>
        </button>
      </td>
      <td><span class="badge ${request.estado}">${mobileStatusLabel(request.estado)}</span></td>
    </tr>
  `).join('');
}

function ordersTableSection(title, requests, emptyMessage){
  return `
    <section class="orders-section">
      <div class="orders-section-title"><span>${title}</span><span class="orders-count">${requests.length}</span></div>
      <div class="card mobile-orders-card">
        <table class="mobile-orders-table" aria-label="${title}">
          <thead><tr><th>Fecha</th><th>Ver</th><th>Estado</th></tr></thead>
          <tbody>${requests.length ? mobileOrderRows(requests) : `<tr><td colspan="3" class="empty-orders-row">${emptyMessage}</td></tr>`}</tbody>
        </table>
      </div>
    </section>`;
}

function screenTrack(){
  const header = appScreenHeader('Mis pedidos','Consulta el estado de tus solicitudes');
  if(!patientRequestsLoaded){
    return `${header}<div class="card orders-empty-state" role="status">Cargando tus solicitudes...</div>`;
  }
  if(patientRequestsError){
    return `${header}<div class="card orders-empty-state" role="alert">${escapeOptionText(patientRequestsError)}</div>`;
  }
  if(!patientRequests.length){
    return `
      ${header}
      <div class="card orders-empty-state" role="status">
        <p><strong>Aún no tienes solicitudes registradas.</strong></p>
        <p>Cuando pidas tus medicamentos, aquí podrás ver si fueron aprobadas o rechazadas.</p>
        <button class="big-btn primary" type="button" onclick="renderScreen('request'); setNav('home')">Pedir mis medicamentos</button>
      </div>`;
  }
  const pending = patientRequests.filter(request => request.estado === 'pendiente');
  const approved = patientRequests.filter(request => request.estado === 'aprobada');
  const rejected = patientRequests.filter(request => request.estado === 'rechazada');
  return `
    ${header}
    ${ordersTableSection('Pendientes', pending, 'No tienes solicitudes pendientes.')}
    ${ordersTableSection('Aprobadas', approved, 'No tienes solicitudes aprobadas.')}
    ${ordersTableSection('Rechazadas', rejected, 'No tienes solicitudes rechazadas.')}
  `;
}

function mobileTimeline(request){
  const decided = request.estado !== 'pendiente';
  const finalLabel = request.estado === 'rechazada' ? 'Solicitud rechazada' : 'Solicitud aprobada';
  const steps = [
    {label:'Solicitud recibida', cls:'done', time:formatDateTimeShort(request.creadaEn)},
    {label:'Revisión de Cruz Verde', cls:decided ? 'done' : 'current', time:decided ? 'Completado' : 'Estado actual'},
    {label:decided ? finalLabel : 'Decisión', cls:decided ? `current ${request.estado}` : '', time:decided ? formatDateTimeShort(request.fechaDecision) : 'Pendiente'}
  ];
  const items = steps.map(step => `
      <li class="${step.cls}">
        <div class="dot">${step.cls ? (step.cls.includes('rechazada') ? '✕' : '✓') : ''}</div>
        <div>
          <div class="label">${step.label}</div>
          <div class="time">${step.time}</div>
        </div>
      </li>`).join('');
  return `
    <div class="card mobile-progress-card">
      <div class="mobile-progress-heading">Seguimiento de la solicitud</div>
      <div class="mobile-progress-sub">Solicitud ${escapeOptionText(request.codigo)}</div>
      <ul class="timeline compact-order-timeline">${items}</ul>
    </div>`;
}

function openMobileOrderModal(id){
  const request = patientRequests.find(item => item.id === id);
  const layer = document.getElementById('mobileModalLayer');
  const modal = document.getElementById('mobileModalBody');
  if(!request || !layer || !modal) return;
  openMobileRequestId = id;
  modal.innerHTML = `
    <div class="mobile-modal-header">
      <h3>Detalle de la solicitud</h3>
      <button class="mobile-modal-close" type="button" onclick="closeMobileOrderModal()" aria-label="Cerrar">✕</button>
    </div>
    <div class="mobile-detail-list">
      <div class="mobile-detail-row">
        <span class="mobile-detail-label">Fecha de solicitud</span>
        <span class="mobile-detail-value">${formatDateTimeShort(request.creadaEn)}</span>
      </div>
      <div class="mobile-detail-row">
        <span class="mobile-detail-label">Medicamentos solicitados</span>
        <span class="mobile-detail-value">${request.medicamentos.map(escapeOptionText).join(', ')}</span>
      </div>
      <div class="mobile-detail-row">
        <span class="mobile-detail-label">Dirección de entrega</span>
        <span class="mobile-detail-value">${escapeOptionText(request.direccion)}</span>
      </div>
      <div class="mobile-detail-row">
        <span class="mobile-detail-label">Fecha deseada de entrega</span>
        <span class="mobile-detail-value">${formatPortalDate(request.fechaEntrega)}</span>
      </div>
      <div class="mobile-detail-row">
        <span class="mobile-detail-label">Estado</span>
        <span class="mobile-detail-value"><span class="badge ${request.estado}">${mobileStatusLabel(request.estado)}</span></span>
      </div>
      ${request.estado === 'rechazada' ? `
      <div class="mobile-detail-row mobile-reject-reason">
        <span class="mobile-detail-label">Motivo del rechazo</span>
        <span class="mobile-detail-value">${escapeOptionText(request.motivoRechazo)}</span>
      </div>` : ''}
    </div>
    ${mobileTimeline(request)}
  `;
  layer.classList.add('active');
  layer.setAttribute('aria-hidden','false');
}

function handleMobileModalBackdrop(event){
  if(event.target.id === 'mobileModalLayer') closeMobileOrderModal();
}

function closeMobileOrderModal(){
  openMobileRequestId = null;
  const layer = document.getElementById('mobileModalLayer');
  const modal = document.getElementById('mobileModalBody');
  if(layer){
    layer.classList.remove('active');
    layer.setAttribute('aria-hidden','true');
  }
  if(modal) modal.innerHTML = '';
}

function initialsFromName(name){
  return String(name || '').split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0].toUpperCase()).join('') || '?';
}

function formatBirthDate(value){
  if(!value) return 'No registrada';
  return formatPortalDate(value);
}

function profileRow(icon, label, value){
  return `
      <div class="profile-row">
        <div class="profile-ico" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></div>
        <div><div class="profile-label">${label}</div><div class="profile-value">${escapeOptionText(value || 'No registrado')}</div></div>
      </div>`;
}

function screenProfile(){
  const p = patientProfile();
  const icons = {
    document:'<rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="8" cy="11" r="2"></circle><path d="M5.5 16c.6-1.7 1.7-2.5 3-2.5s2.4.8 3 2.5"></path><path d="M14 10h4M14 14h3"></path>',
    birth:'<path d="M5 10h14v9H5zM4 14h16"></path><path d="M8 10V7M12 10V6M16 10V7"></path>',
    health:'<path d="M6 3v5a4 4 0 0 0 8 0V3"></path><path d="M4 3h4M12 3h4M10 12v2a5 5 0 0 0 10 0v-1"></path><circle cx="20" cy="10" r="2"></circle>',
    phone:'<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M10 5h4M11 18h2"></path>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path>',
    pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle>',
    home:'<path d="m3 11 9-8 9 8"></path><path d="M5 10v10h14V10M9 20v-6h6v6"></path>'
  };
  return `
    ${appScreenHeader('Mi perfil','Consulta tus datos personales y de contacto')}
    <div class="profile-header">
      <div class="profile-avatar" aria-hidden="true">${escapeOptionText(initialsFromName(p.nombre))}</div>
      <div class="profile-name">${escapeOptionText(p.nombre || '')}</div>
      <div class="profile-role">Afiliado(a) ${escapeOptionText(p.eps || 'EPS Sura')}</div>
    </div>
    <div class="profile-section-title">Datos personales</div>
    <div class="card">
      ${profileRow(icons.document, 'Documento', `${p.tipoDocumento || ''} - ${p.documento || ''}`)}
      ${profileRow(icons.birth, 'Fecha de nacimiento', formatBirthDate(p.fechaNacimiento))}
      ${profileRow(icons.health, 'Entidad de salud', p.eps)}
    </div>
    <div class="profile-section-title">Contacto</div>
    <div class="card">
      ${profileRow(icons.phone, 'Teléfono celular', p.telefono)}
      ${profileRow(icons.mail, 'Correo electrónico', p.correo)}
    </div>
    <div class="profile-section-title">Dirección de entrega</div>
    <div class="card">
      ${profileRow(icons.pin, 'Dirección principal', p.direccion)}
      ${profileRow(icons.home, 'Indicaciones', p.indicaciones)}
    </div>
    <button class="logout-btn" onclick="logout()">
      <span class="logout-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M10 5H5v14h5"></path><path d="M14 8l4 4-4 4"></path><path d="M18 12H9"></path></svg>
      </span>
      <span class="logout-copy">
        <span class="logout-title">Cerrar sesión</span>
        <span class="logout-description">Volver a la pantalla de ingreso</span>
      </span>
    </button>
  `;
}

async function logout(){
  stopPatientRequestsListener();
  isAuthenticated = false;
  patientRequests = [];
  patientRequestsLoaded = false;
  order = { meds:[], deliveryDate:'' };
  try{ await window.FB?.logout('paciente'); }catch(error){ console.error(error); }
  setNav('home');
  applyAccessibilitySettings();
  renderScreen('login');
}

function screenHelp(){
  const faqs = [
    {
      question:'¿Cómo solicito mis medicamentos?',
      answer:'Desde Inicio selecciona “Pedir mis medicamentos”, marca los medicamentos autorizados, elige una dirección y confirma la solicitud.'
    },
    {
      question:'¿Dónde puedo consultar mis pedidos?',
      answer:'En la pestaña “Mis pedidos” verás tus solicitudes agrupadas en pendientes, aprobadas y rechazadas. Selecciona el icono de consulta para ver el detalle.'
    },
    {
      question:'¿Cómo sé si mi solicitud fue aprobada?',
      answer:'Abre “Mis pedidos”. El estado cambia a Aprobada o Rechazada en cuanto Cruz Verde revisa tu solicitud.'
    },
    {
      question:'¿Puedo usar una dirección diferente?',
      answer:'Sí. Al solicitar los medicamentos puedes elegir una dirección guardada o registrar una nueva con ciudad, municipio, dirección, barrio e información complementaria.'
    },
    {
      question:'¿Qué hago si mi solicitud es rechazada?',
      answer:'En el detalle de la solicitud verás el motivo del rechazo. Corrige lo indicado, por ejemplo la fórmula médica, y realiza una nueva solicitud.'
    },
    {
      question:'¿Mi cuidador puede hacer la solicitud?',
      answer:'Sí. Tu cuidador puede ayudarte a realizar la solicitud desde la aplicación o comunicarse con Cruz Verde para que un operador la registre por ti.'
    }
  ];

  return `
    ${appScreenHeader('Preguntas frecuentes','Encuentra respuestas sobre solicitudes y entregas')}
    <div class="faq-list">
      ${faqs.map((faq,index)=>`
        <div class="faq-item">
          <button
            class="faq-question"
            type="button"
            aria-expanded="false"
            aria-controls="faq-answer-${index}"
            onclick="toggleFaq(this)"
          >
            <span>${faq.question}</span>
            <span class="faq-toggle-icon" aria-hidden="true">+</span>
          </button>
          <div class="faq-answer" id="faq-answer-${index}">
            <p>${faq.answer}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleFaq(button){
  const answerId = button.getAttribute('aria-controls');
  const answer = document.getElementById(answerId);
  if(!answer) return;

  const willOpen = button.getAttribute('aria-expanded') !== 'true';
  document.querySelectorAll('#phoneContent .faq-question').forEach(item=>{
    item.setAttribute('aria-expanded','false');
  });
  document.querySelectorAll('#phoneContent .faq-answer').forEach(item=>{
    item.classList.remove('open');
  });

  if(willOpen){
    button.setAttribute('aria-expanded','true');
    answer.classList.add('open');
  }
}


function updatePhoneClock(){
  const clock = document.getElementById('phoneClock');
  if(!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('es-CO', {hour:'numeric', minute:'2-digit', hour12:false});
}
updatePhoneClock();
setInterval(updatePhoneClock, 30000);

document.addEventListener('click', (event) => {
  const widget = document.getElementById('accessibilityWidget');
  const panel = document.getElementById('accessibilityPanel');
  if(!widget || !panel || panel.hidden) return;
  if(!widget.contains(event.target)) closeAccessibilityPanel();
});

/* ---------------- Portal web ---------------- */
function escapePortalHtml(value){
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function normalizePortalDocument(value){
  return String(value || '').replace(/\D/g,'');
}

function setPortalLoginError(message){
  const error = document.getElementById('portalLoginError');
  if(!error) return;
  error.textContent = message || '';
  error.classList.toggle('show', Boolean(message));
}

/* ---------------- Portal web: estado ---------------- */
let isPortalAuthenticated = false;
let activePortalSection = 'requests';
let solicitudes = [];
let solicitudesLoaded = false;
let solicitudesError = '';
let solicitudesUpdatedAt = null;
let unsubscribePortalRequests = null;
let newRequestIds = new Set();
let portalOpenRequestId = null;
let portalOpenRequestJson = '';
let pacientes = [];
let pacientesLoaded = false;

function operatorProfile(){
  return window.FB?.perfil('portal') || {};
}

function renderPortalAccess(){
  const loginView = document.getElementById('portalLoginView');
  const portalApp = document.getElementById('portalApp');
  if(!loginView || !portalApp) return;
  loginView.hidden = isPortalAuthenticated;
  portalApp.hidden = !isPortalAuthenticated;
  if(isPortalAuthenticated){
    const profile = operatorProfile();
    const sessionRole = document.getElementById('portalSessionRole');
    if(sessionRole) sessionRole.textContent = `${profile.nombre || 'Operador'} (Operador)${profile.sede ? ` — Sede ${profile.sede}` : ''}`;
    showPortalSection(activePortalSection);
  }else{
    requestAnimationFrame(()=>document.getElementById('portalLoginEmail')?.focus());
  }
}

/* HU-01: inicio de sesión del operador */
async function handlePortalLogin(event){
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const emailInput = document.getElementById('portalLoginEmail');
  const passwordInput = document.getElementById('portalLoginPassword');
  const email = String(emailInput?.value || '').trim();
  const password = String(passwordInput?.value || '');
  if(!email || !password){
    setPortalLoginError('Ingresa el correo y la contraseña.');
    (!email ? emailInput : passwordInput)?.focus();
    return;
  }
  if(password.length < 6){
    setPortalLoginError('La contraseña debe tener al menos 6 caracteres.');
    passwordInput?.focus();
    return;
  }
  setButtonBusy(button, true, 'Validando...');
  try{
    const FB = await whenFirebaseReady();
    await FB.loginOperador(email, password);
  }catch(error){
    setButtonBusy(button, false);
    setPortalLoginError(firebaseErrorMessage(error));
    passwordInput?.focus();
    passwordInput?.select();
    return;
  }
  setButtonBusy(button, false);
  setPortalLoginError('');
  if(passwordInput) passwordInput.value = '';
  isPortalAuthenticated = true;
  activePortalSection = 'requests';
  startPortalRequestsListener();
  renderPortalAccess();
}

async function logoutPortal(){
  stopPortalRequestsListener();
  isPortalAuthenticated = false;
  solicitudes = [];
  solicitudesLoaded = false;
  pacientes = [];
  pacientesLoaded = false;
  closeModal();
  try{ await window.FB?.logout('portal'); }catch(error){ console.error(error); }
  const emailInput = document.getElementById('portalLoginEmail');
  const passwordInput = document.getElementById('portalLoginPassword');
  if(emailInput) emailInput.value = '';
  if(passwordInput) passwordInput.value = '';
  setPortalLoginError('');
  renderPortalAccess();
}

/* HU-03: escucha en tiempo real de la colección solicitudes */
function startPortalRequestsListener(){
  stopPortalRequestsListener();
  solicitudes = [];
  solicitudesLoaded = false;
  solicitudesError = '';
  newRequestIds = new Set();
  try{
    unsubscribePortalRequests = window.FB.escucharSolicitudesPortal(items => {
      const previousIds = new Set(solicitudes.map(item => item.id));
      if(solicitudesLoaded){
        items.filter(item => !previousIds.has(item.id)).forEach(item => newRequestIds.add(item.id));
      }
      solicitudes = items;
      solicitudesLoaded = true;
      solicitudesError = '';
      solicitudesUpdatedAt = Date.now();
      if(isPortalAuthenticated && activePortalSection === 'requests') renderPortal();
      if(portalOpenRequestId) refreshOpenPortalModal();
    }, error => {
      console.error(error);
      solicitudesLoaded = true;
      solicitudesError = firebaseErrorMessage(error);
      if(isPortalAuthenticated && activePortalSection === 'requests') renderPortal();
    });
  }catch(error){
    solicitudesLoaded = true;
    solicitudesError = firebaseErrorMessage(error);
  }
}

function stopPortalRequestsListener(){
  if(typeof unsubscribePortalRequests === 'function') unsubscribePortalRequests();
  unsubscribePortalRequests = null;
}

function showPortalSection(section){
  if(!isPortalAuthenticated){
    renderPortalAccess();
    return;
  }
  const allowedSections = ['requests','create-request'];
  activePortalSection = allowedSections.includes(section) ? section : 'requests';
  document.getElementById('portalNavRequests')?.classList.toggle('active', activePortalSection === 'requests');
  document.getElementById('portalNavCreateRequest')?.classList.toggle('active', activePortalSection === 'create-request');
  renderPortal();
}

function portalBadge(status){
  return `<span class="badge ${status}">${requestStatusLabels[status] || escapePortalHtml(status)}</span>`;
}

function formulaCell(request){
  return request.tieneFormula
    ? '<span class="formula-tag ok">Registrada</span>'
    : '<span class="formula-tag missing">Sin fórmula</span>';
}

function renderPortal(){
  const content = document.getElementById('portalContent');
  if(!content) return;
  if(activePortalSection === 'create-request'){
    renderCreateRequestSection();
    return;
  }

  if(!solicitudesLoaded){
    content.innerHTML = `
      <h2>Solicitudes de entrega domiciliaria</h2>
      <div class="sub" role="status">Conectando con la base de datos...</div>`;
    return;
  }
  if(solicitudesError){
    content.innerHTML = `
      <h2>Solicitudes de entrega domiciliaria</h2>
      <div class="portal-error-box" role="alert">${escapePortalHtml(solicitudesError)}</div>`;
    return;
  }

  const renderRows = (items, emptyMessage, showActions) => {
    if(!items.length){
      return `<tr><td class="portal-empty" colspan="${showActions ? 7 : 7}">${emptyMessage}</td></tr>`;
    }
    return items.map(s => `
      <tr class="row-clickable ${newRequestIds.has(s.id) ? 'row-new' : ''}" data-request-id="${escapePortalHtml(s.id)}" onclick="openModal('${escapePortalHtml(s.id)}')">
        <td>
          <div class="patient"><span class="name">${escapePortalHtml(s.pacienteNombre)}</span><span class="id">${escapePortalHtml(s.pacienteDocumento)}</span></div>
        </td>
        <td class="chan">${escapePortalHtml(s.canal)}</td>
        <td>${s.medicamentos.map(escapePortalHtml).join(', ')}</td>
        <td class="received-at">${s.creadaEn ? `${formatDateShort(s.creadaEn)}<br>${new Date(s.creadaEn).toLocaleTimeString('es-CO')}` : 'Registrando...'}</td>
        <td>${formulaCell(s)}</td>
        <td>${portalBadge(s.estado)}</td>
        <td>
          <div class="request-actions">
            <button class="btn ghost" type="button" onclick="event.stopPropagation(); openModal('${escapePortalHtml(s.id)}')">Ver</button>
            ${showActions ? `
            <button class="btn approve" type="button" ${s.tieneFormula ? '' : 'disabled title="Registra la fórmula médica antes de aprobar"'}
                    onclick="event.stopPropagation(); approveRequest('${escapePortalHtml(s.id)}', this)">Aprobar</button>
            <button class="btn reject" type="button" onclick="event.stopPropagation(); openRejectRequest('${escapePortalHtml(s.id)}')">Rechazar</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  };

  const group = (title, items, emptyMessage, showActions) => `
    <section class="portal-request-group">
      <h3 class="portal-request-group-title"><span>${title}</span><span class="portal-request-count">${items.length}</span></h3>
      <div class="portal-table-wrap">
        <table>
          <thead>
            <tr><th>Paciente</th><th>Canal</th><th>Medicamentos</th><th>Recibida</th><th>Fórmula</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>${renderRows(items, emptyMessage, showActions)}</tbody>
        </table>
      </div>
    </section>`;

  const pending = solicitudes.filter(s => s.estado === 'pendiente');
  const approved = solicitudes.filter(s => s.estado === 'aprobada');
  const rejected = solicitudes.filter(s => s.estado === 'rechazada');

  content.innerHTML = `
    <h2>Solicitudes de entrega domiciliaria</h2>
    <div class="sub">Las solicitudes llegan en tiempo real desde la app y el canal asistido, sin recargar la página.</div>
    <div class="portal-live-indicator" role="status" aria-live="polite">
      <span class="live-dot" aria-hidden="true"></span>
      En vivo · última actualización ${new Date(solicitudesUpdatedAt || Date.now()).toLocaleTimeString('es-CO')}
    </div>
    ${group('Pendientes de validación', pending, 'No hay solicitudes pendientes.', true)}
    ${group('Aprobadas', approved, 'No hay solicitudes aprobadas.', false)}
    ${group('Rechazadas', rejected, 'No hay solicitudes rechazadas.', false)}
  `;
  setTimeout(() => newRequestIds.clear(), 4000);
}

/* ---------------- HU-04: aprobar o rechazar ---------------- */
function findRequestById(id){
  return solicitudes.find(item => item.id === id) || null;
}

async function approveRequest(id, button){
  const request = findRequestById(id);
  if(!request) return;
  if(request.estado !== 'pendiente'){
    showPrototypeAlert('Esta solicitud ya tiene una decisión registrada.');
    return;
  }
  if(!request.tieneFormula){
    showPrototypeAlert('No se puede aprobar una solicitud sin fórmula médica. Regístrala o rechaza la solicitud indicando el motivo.', {title:'Fórmula requerida'});
    return;
  }
  setButtonBusy(button, true, 'Aprobando...');
  try{
    await window.FB.aprobarSolicitud(id);
  }catch(error){
    console.error(error);
    setButtonBusy(button, false);
    showPrototypeAlert(firebaseErrorMessage(error), {title:'No se pudo aprobar'});
    return;
  }
  closeModal();
  showPrototypeAlert(`La solicitud ${request.codigo} de ${request.pacienteNombre} fue aprobada.`, {title:'Solicitud aprobada'});
}

function openRejectRequest(id){
  const request = findRequestById(id);
  if(!request || request.estado !== 'pendiente') return;
  const overlay = document.getElementById('overlay');
  const modal = document.getElementById('modalBody');
  portalOpenRequestId = null;
  modal.className = 'modal';
  modal.innerHTML = `
    <button class="close" type="button" onclick="closeModal()" aria-label="Cerrar">✕</button>
    <h3>Rechazar solicitud</h3>
    <div style="color:var(--text-muted); font-size:.85rem; margin-bottom:1rem;">${escapePortalHtml(request.codigo)} · ${escapePortalHtml(request.pacienteNombre)}</div>
    <form onsubmit="submitRejectRequest(event, '${escapePortalHtml(request.id)}')" novalidate>
      <div class="portal-form-field full">
        <label for="rejectReason">Motivo del rechazo (obligatorio)</label>
        <textarea id="rejectReason" maxlength="300" placeholder="Ej. La fórmula médica está vencida" required></textarea>
        <p class="portal-field-hint">El paciente verá este motivo en la app.</p>
      </div>
      <div class="portal-form-error" id="rejectReasonError" role="alert"></div>
      <div class="modal-actions">
        <button class="btn ghost" type="button" onclick="closeModal()">Cancelar</button>
        <button class="btn reject" type="submit">Confirmar rechazo</button>
      </div>
    </form>
  `;
  overlay.classList.add('active');
  requestAnimationFrame(() => document.getElementById('rejectReason')?.focus());
}

async function submitRejectRequest(event, id){
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const reason = String(document.getElementById('rejectReason')?.value || '').trim();
  const errorBox = document.getElementById('rejectReasonError');
  if(reason.length < 5){
    if(errorBox){
      errorBox.textContent = 'Escribe el motivo del rechazo (mínimo 5 caracteres).';
      errorBox.classList.add('show');
    }
    document.getElementById('rejectReason')?.focus();
    return;
  }
  const request = findRequestById(id);
  setButtonBusy(button, true, 'Guardando...');
  try{
    await window.FB.rechazarSolicitud(id, reason);
  }catch(error){
    console.error(error);
    setButtonBusy(button, false);
    showPrototypeAlert(firebaseErrorMessage(error), {title:'No se pudo rechazar'});
    return;
  }
  closeModal();
  showPrototypeAlert(`La solicitud ${request?.codigo || ''} fue rechazada. El paciente verá el motivo en la app.`, {title:'Solicitud rechazada'});
}

const ALLOWED_FORMULA_TYPES = ['application/pdf','image/jpeg','image/png'];
const MAX_FORMULA_BYTES = 5 * 1024 * 1024;

function validateFormulaFile(file){
  if(!file) return 'Selecciona el archivo de la fórmula médica.';
  if(!ALLOWED_FORMULA_TYPES.includes(file.type)) return 'La fórmula debe ser un archivo PDF, JPG o PNG.';
  if(file.size > MAX_FORMULA_BYTES) return 'La fórmula no puede superar 5 MB.';
  return '';
}

async function registerFormula(id, button){
  const file = document.getElementById('formulaFile')?.files?.[0];
  const message = validateFormulaFile(file);
  if(message){
    showPrototypeAlert(message, {title:'Fórmula médica', returnFocus:'#formulaFile'});
    return;
  }
  setButtonBusy(button, true, 'Registrando...');
  try{
    await window.FB.registrarFormula(id, file.name);
  }catch(error){
    console.error(error);
    setButtonBusy(button, false);
    showPrototypeAlert(firebaseErrorMessage(error), {title:'No se pudo registrar'});
  }
}

function refreshOpenPortalModal(){
  if(!portalOpenRequestId) return;
  const request = findRequestById(portalOpenRequestId);
  if(!request){
    closeModal();
    return;
  }
  if(JSON.stringify(request) === portalOpenRequestJson) return;
  openModal(portalOpenRequestId);
}

function openModal(id){
  const s = findRequestById(id);
  if(!s) return;
  portalOpenRequestId = id;
  portalOpenRequestJson = JSON.stringify(s);
  const overlay = document.getElementById('overlay');
  const modal = document.getElementById('modalBody');
  const pending = s.estado === 'pendiente';
  modal.className = 'modal';
  modal.innerHTML = `
    <button class="close" type="button" onclick="closeModal()" aria-label="Cerrar">✕</button>
    <h3>${escapePortalHtml(s.pacienteNombre)}</h3>
    <div style="color:var(--text-muted); font-size:.85rem; margin-bottom:1rem;">${escapePortalHtml(s.pacienteDocumento)} · Solicitud ${escapePortalHtml(s.codigo)}</div>
    <div class="field"><div class="k">Canal de solicitud</div><div class="v">${escapePortalHtml(s.canal)}</div></div>
    <div class="field"><div class="k">Recibida</div><div class="v">${formatDateTimeShort(s.creadaEn, true)}</div></div>
    <div class="field"><div class="k">Medicamentos solicitados</div><div class="v">${s.medicamentos.map(escapePortalHtml).join(', ')}</div></div>
    ${s.fechaEntrega ? `<div class="field"><div class="k">Fecha deseada de entrega</div><div class="v">${formatPortalDate(s.fechaEntrega)}</div></div>` : ''}
    ${s.direccion ? `<div class="field"><div class="k">Dirección de entrega</div><div class="v">${escapePortalHtml(s.direccion)}</div></div>` : ''}
    ${s.notas ? `<div class="field"><div class="k">Observaciones</div><div class="v">${escapePortalHtml(s.notas)}</div></div>` : ''}
    <div class="field"><div class="k">Estado actual</div><div class="v">${portalBadge(s.estado)}</div></div>
    ${s.estado === 'rechazada' ? `<div class="field"><div class="k">Motivo del rechazo</div><div class="v">${escapePortalHtml(s.motivoRechazo)}</div></div>` : ''}
    ${!pending ? `<div class="field"><div class="k">Decisión registrada</div><div class="v">${escapePortalHtml(s.decididaPorNombre || 'Operador')} · ${formatDateTimeShort(s.fechaDecision)}</div></div>` : ''}
    <div class="field"><div class="k">Fórmula médica</div><div class="v">${s.tieneFormula ? `📎 ${escapePortalHtml(s.formulaNombre || 'Registrada')}` : '<span class="formula-tag missing">Sin fórmula registrada</span>'}</div></div>
    ${pending && !s.tieneFormula ? `
    <div class="formula-register-box">
      <label for="formulaFile">Registrar la fórmula médica presentada por el paciente</label>
      <input id="formulaFile" type="file" accept=".pdf,.jpg,.jpeg,.png">
      <p class="portal-field-hint">PDF, JPG o PNG de máximo 5 MB. Sin fórmula registrada la solicitud no se puede aprobar.</p>
      <button class="btn ghost" type="button" onclick="registerFormula('${escapePortalHtml(s.id)}', this)">Registrar fórmula</button>
    </div>` : ''}
    <div class="modal-actions">
      <button class="btn ghost" type="button" onclick="closeModal()">Cerrar</button>
      ${pending ? `
      <button class="btn reject" type="button" onclick="openRejectRequest('${escapePortalHtml(s.id)}')">Rechazar</button>
      <button class="btn approve" type="button" ${s.tieneFormula ? '' : 'disabled title="Registra la fórmula médica antes de aprobar"'}
              onclick="approveRequest('${escapePortalHtml(s.id)}', this)">Aprobar</button>` : ''}
    </div>
  `;
  overlay.classList.add('active');
}

function closeModal(){
  portalOpenRequestId = null;
  portalOpenRequestJson = '';
  document.getElementById('overlay').classList.remove('active');
  const modal = document.getElementById('modalBody');
  modal.className = 'modal';
  modal.innerHTML = '';
}

function portalTodayIso(){
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0,10);
}

let selectedPortalMedicines = [];

const portalMedicineCatalog = [
  'Losartán 50mg',
  'Metformina 850mg',
  'Atorvastatina 20mg',
  'Enalapril 10mg',
  'Aspirina 100mg',
  'Insulina Glargina',
  'Amlodipino 5mg',
  'Levotiroxina 50mcg',
  'Omeprazol 20mg',
  'Acetaminofén 500mg',
  'Hidroclorotiazida 25mg',
  'Salbutamol inhalador'
];

function normalizePortalSearch(value){
  return String(value || '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function normalizeDocumentSearch(value){
  return String(value || '').replace(/\D/g,'');
}

function renderCreateRequestSection(){
  const content = document.getElementById('portalContent');
  selectedPortalMedicines = [];
  content.innerHTML = `
    <div class="portal-heading-row">
      <div>
        <h2>Crear solicitud</h2>
        <div class="sub">Registra una solicitud recibida por WhatsApp y vincúlala con un paciente de la base de datos.</div>
      </div>
    </div>
    <div class="portal-request-help">
      Busca al paciente por su número de cédula y agrega uno o varios medicamentos desde el catálogo.
    </div>
    <form class="portal-request-form" id="createRequestForm" onsubmit="savePortalRequest(event)">
      <div class="portal-form-grid">
        <div class="portal-form-field full">
          <label for="requestPatientSearch">Buscar paciente por cédula</label>
          <div class="portal-search-picker">
            <input id="requestPatientSearch" type="search" inputmode="numeric" autocomplete="off"
                   placeholder="Escribe el número de cédula"
                   oninput="searchPortalPatientsByDocument(this.value)"
                   onfocus="searchPortalPatientsByDocument(this.value)">
            <input id="requestPatient" name="patientId" type="hidden">
            <div class="portal-search-results" id="requestPatientResults" hidden></div>
          </div>
          <div class="portal-selected-patient" id="selectedPortalPatient" hidden></div>
          <p class="portal-field-hint">La búsqueda se realiza únicamente por el número de documento.</p>
        </div>
        <div class="portal-form-field">
          <label for="requestDocument">Documento</label>
          <input class="portal-readonly" id="requestDocument" readonly placeholder="Se completa automáticamente">
        </div>
        <div class="portal-form-field">
          <label for="requestPhone">Teléfono</label>
          <input class="portal-readonly" id="requestPhone" readonly placeholder="Se completa automáticamente">
        </div>
        <div class="portal-form-field">
          <label for="requestEps">EPS</label>
          <input class="portal-readonly" id="requestEps" readonly placeholder="Se completa automáticamente">
        </div>
        <div class="portal-form-field">
          <label for="requestChannel">Canal de recepción</label>
          <input class="portal-readonly" id="requestChannel" name="channel" readonly value="WhatsApp (asistido)">
        </div>
        <div class="portal-form-field full">
          <label for="requestMedicineSearch">Medicamentos solicitados</label>
          <div class="portal-search-picker">
            <input id="requestMedicineSearch" type="search" autocomplete="off"
                   placeholder="Buscar medicamento por nombre"
                   oninput="filterPortalMedicineOptions(this.value)"
                   onfocus="filterPortalMedicineOptions(this.value)">
            <div class="portal-search-results" id="requestMedicineResults" hidden></div>
          </div>
          <div class="portal-medicine-selected" id="selectedPortalMedicines" aria-live="polite"></div>
          <p class="portal-field-hint">Puedes buscar y agregar varios medicamentos. Para eliminar uno, pulsa la ×.</p>
        </div>
        <div class="portal-form-field">
          <label for="requestDeliveryDate">Fecha deseada de entrega</label>
          <input id="requestDeliveryDate" name="deliveryDate" type="date" min="${portalTodayIso()}" required>
        </div>
        <div class="portal-form-field">
          <label for="requestPrescription">Fórmula médica (PDF, JPG o PNG)</label>
          <input id="requestPrescription" name="prescription" type="file" accept=".pdf,.jpg,.jpeg,.png">
        </div>
        <div class="portal-form-field full">
          <div class="portal-field-label-row">
            <label for="requestAddress">Dirección de entrega</label>
            <button class="portal-inline-edit" id="requestAddressEditBtn" type="button" disabled onclick="togglePortalRequestAddressEdit()">Editar</button>
          </div>
          <input class="portal-address-locked" id="requestAddress" name="address" required readonly aria-readonly="true" placeholder="Se completa desde el registro del paciente">
          <p class="portal-field-hint">La dirección se carga desde la ficha del paciente. Usa Editar solo si esta solicitud requiere una dirección diferente.</p>
        </div>
        <div class="portal-form-field full">
          <label for="requestNotes">Observaciones de la conversación</label>
          <textarea id="requestNotes" name="notes" placeholder="Indicaciones de acceso, horario, movilidad u otra información relevante"></textarea>
        </div>
      </div>
      <div class="portal-form-actions">
        <button class="btn ghost" type="reset" onclick="setTimeout(resetPortalRequestForm,0)">Limpiar</button>
        <button class="btn approve" type="submit">Crear solicitud</button>
      </div>
    </form>
  `;
  loadPortalPatients();
}

function findPatientByPortalId(id){
  return pacientes.find(patient=>patient.id === id) || null;
}

function searchPortalPatientsByDocument(value){
  const results = document.getElementById('requestPatientResults');
  if(!results) return;
  const query = normalizeDocumentSearch(value);
  const selectedField = document.getElementById('requestPatient');
  const selectedPatient = findPatientByPortalId(selectedField?.value || '');
  if(selectedPatient && query !== normalizeDocumentSearch(selectedPatient.document)){
    if(selectedField) selectedField.value = '';
    const summary = document.getElementById('selectedPortalPatient');
    if(summary){ summary.hidden = true; summary.innerHTML = ''; }
    ['requestDocument','requestPhone','requestEps','requestAddress'].forEach(id=>{
      const field = document.getElementById(id);
      if(field) field.value = '';
    });
    setPortalRequestAddressLocked(true);
  }
  if(!query){
    results.hidden = true;
    results.innerHTML = '';
    return;
  }
  if(!pacientesLoaded){
    results.innerHTML = '<div class="portal-search-empty">Cargando pacientes...</div>';
    results.hidden = false;
    return;
  }
  const matches = pacientes
    .filter(patient=>patient.status === 'activo')
    .filter(patient=>normalizeDocumentSearch(patient.document).includes(query))
    .slice(0,8);
  results.innerHTML = matches.length
    ? matches.map(patient=>`
        <button class="portal-search-option" type="button" onclick="selectPortalRequestPatient('${escapePortalHtml(patient.id)}')">
          <span><strong>${escapePortalHtml(patient.documentType)} ${escapePortalHtml(patient.document)}</strong><small>${escapePortalHtml(patient.name)}</small></span>
          <span class="add-mark">Seleccionar</span>
        </button>`).join('')
    : '<div class="portal-search-empty">No se encontró un paciente activo con esa cédula.</div>';
  results.hidden = false;
}

function selectPortalRequestPatient(patientId){
  const patient = findPatientByPortalId(patientId);
  if(!patient) return;
  const hiddenField = document.getElementById('requestPatient');
  const searchField = document.getElementById('requestPatientSearch');
  const results = document.getElementById('requestPatientResults');
  const summary = document.getElementById('selectedPortalPatient');
  if(hiddenField) hiddenField.value = patient.id;
  if(searchField) searchField.value = patient.document;
  if(results) results.hidden = true;
  if(summary){
    summary.innerHTML = `
      <div><strong>${escapePortalHtml(patient.name)}</strong><span>${escapePortalHtml(patient.documentType)} ${escapePortalHtml(patient.document)}</span></div>
      <button class="portal-mini-remove" type="button" aria-label="Quitar paciente" onclick="clearPortalRequestPatient()">×</button>`;
    summary.hidden = false;
  }
  fillPortalRequestPatient();
}

function setPortalRequestAddressLocked(locked = true){
  const field = document.getElementById('requestAddress');
  const button = document.getElementById('requestAddressEditBtn');
  const hasPatient = Boolean(document.getElementById('requestPatient')?.value);
  if(field){
    field.readOnly = locked;
    field.setAttribute('aria-readonly', locked ? 'true' : 'false');
    field.classList.toggle('portal-address-locked', locked);
  }
  if(button){
    button.disabled = !hasPatient;
    button.textContent = locked ? 'Editar' : 'Finalizar edición';
    button.setAttribute('aria-pressed', locked ? 'false' : 'true');
  }
}

function togglePortalRequestAddressEdit(){
  const field = document.getElementById('requestAddress');
  const patient = findPatientByPortalId(document.getElementById('requestPatient')?.value || '');
  if(!field || !patient) return;
  const unlock = field.readOnly;
  setPortalRequestAddressLocked(!unlock);
  if(unlock){
    field.focus();
    field.select();
  }
}

function fillPortalRequestPatient(){
  const patient = findPatientByPortalId(document.getElementById('requestPatient')?.value || '');
  const documentField = document.getElementById('requestDocument');
  const phoneField = document.getElementById('requestPhone');
  const epsField = document.getElementById('requestEps');
  const addressField = document.getElementById('requestAddress');
  if(documentField) documentField.value = patient ? `${patient.documentType} ${patient.document}` : '';
  if(phoneField) phoneField.value = patient?.phone || '';
  if(epsField) epsField.value = patient?.eps || '';
  if(addressField) addressField.value = patient?.address || '';
  setPortalRequestAddressLocked(true);
}

function clearPortalRequestPatient(){
  const patientField = document.getElementById('requestPatient');
  const searchField = document.getElementById('requestPatientSearch');
  const summary = document.getElementById('selectedPortalPatient');
  const results = document.getElementById('requestPatientResults');
  if(patientField) patientField.value = '';
  if(searchField) searchField.value = '';
  if(summary){ summary.hidden = true; summary.innerHTML = ''; }
  if(results){ results.hidden = true; results.innerHTML = ''; }
  ['requestDocument','requestPhone','requestEps','requestAddress'].forEach(id=>{
    const field = document.getElementById(id);
    if(field) field.value = '';
  });
  setPortalRequestAddressLocked(true);
}

function filterPortalMedicineOptions(value){
  const results = document.getElementById('requestMedicineResults');
  if(!results) return;
  const query = normalizePortalSearch(value);
  const matches = portalMedicineCatalog
    .filter(medicine=>!selectedPortalMedicines.includes(medicine))
    .filter(medicine=>normalizePortalSearch(medicine).includes(query))
    .slice(0,10);
  results.innerHTML = matches.length
    ? matches.map(medicine=>`
        <button class="portal-search-option" type="button" onclick="addPortalMedicine('${escapePortalHtml(medicine).replaceAll('&#039;', "\\'")}')">
          <span><strong>${escapePortalHtml(medicine)}</strong><small>Agregar a la solicitud</small></span>
          <span class="add-mark">＋</span>
        </button>`).join('')
    : '<div class="portal-search-empty">No hay medicamentos disponibles con ese criterio.</div>';
  results.hidden = false;
}

function addPortalMedicine(medicine){
  if(!portalMedicineCatalog.includes(medicine) || selectedPortalMedicines.includes(medicine)) return;
  selectedPortalMedicines.push(medicine);
  const searchField = document.getElementById('requestMedicineSearch');
  const results = document.getElementById('requestMedicineResults');
  if(searchField) searchField.value = '';
  if(results) results.hidden = true;
  renderSelectedPortalMedicines();
}

function removePortalMedicine(index){
  selectedPortalMedicines.splice(index,1);
  renderSelectedPortalMedicines();
}

function renderSelectedPortalMedicines(){
  const container = document.getElementById('selectedPortalMedicines');
  if(!container) return;
  container.innerHTML = selectedPortalMedicines.map((medicine,index)=>`
    <span class="portal-medicine-chip">
      ${escapePortalHtml(medicine)}
      <button type="button" aria-label="Eliminar ${escapePortalHtml(medicine)}" onclick="removePortalMedicine(${index})">×</button>
    </span>`).join('');
}

function resetPortalRequestForm(){
  selectedPortalMedicines = [];
  clearPortalRequestPatient();
  renderSelectedPortalMedicines();
  const medicineSearch = document.getElementById('requestMedicineSearch');
  const medicineResults = document.getElementById('requestMedicineResults');
  if(medicineSearch) medicineSearch.value = '';
  if(medicineResults){ medicineResults.hidden = true; medicineResults.innerHTML = ''; }
}

async function loadPortalPatients(){
  if(pacientesLoaded) return;
  try{
    pacientes = await window.FB.listarPacientesActivos();
    pacientesLoaded = true;
  }catch(error){
    console.error(error);
    showPrototypeAlert(firebaseErrorMessage(error), {title:'No se pudieron cargar los pacientes'});
  }
  const search = document.getElementById('requestPatientSearch');
  if(search && document.activeElement === search) searchPortalPatientsByDocument(search.value);
}

async function savePortalRequest(event){
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  if(!form.reportValidity()) return;
  const data = new FormData(form);
  const patient = findPatientByPortalId(document.getElementById('requestPatient')?.value || '');
  if(!patient){
    showPrototypeAlert('Busca y selecciona un paciente válido por su número de cédula.', {returnFocus:'#requestPatientSearch'});
    return;
  }
  if(!selectedPortalMedicines.length){
    showPrototypeAlert('Agrega al menos un medicamento desde el catálogo.', {returnFocus:'#requestMedicineSearch'});
    return;
  }
  const deliveryDate = String(data.get('deliveryDate') || '');
  if(deliveryDate < portalTodayIso()){
    showPrototypeAlert('La fecha de entrega no puede ser anterior a hoy.', {returnFocus:'#requestDeliveryDate'});
    return;
  }
  const address = String(data.get('address') || '').trim();
  if(!address){
    showPrototypeAlert('Ingresa la dirección de entrega.', {returnFocus:'#requestAddress'});
    return;
  }
  const prescriptionFile = document.getElementById('requestPrescription')?.files?.[0];
  if(prescriptionFile){
    const fileError = validateFormulaFile(prescriptionFile);
    if(fileError){
      showPrototypeAlert(fileError, {returnFocus:'#requestPrescription'});
      return;
    }
  }
  setButtonBusy(button, true, 'Guardando...');
  try{
    await window.FB.crearSolicitudOperador({
      paciente:patient,
      medicamentos:[...selectedPortalMedicines],
      direccion:address,
      fechaEntrega:deliveryDate,
      notas:String(data.get('notes') || '').trim(),
      formulaNombre:prescriptionFile?.name || ''
    });
  }catch(error){
    console.error(error);
    setButtonBusy(button, false);
    showPrototypeAlert(firebaseErrorMessage(error), {title:'No se pudo crear la solicitud'});
    return;
  }
  setButtonBusy(button, false);
  showPortalSection('requests');
  showPrototypeAlert(`La solicitud de ${patient.name} fue registrada y quedó en estado Pendiente.`, {title:'Solicitud creada'});
}

function formatPortalDate(value){
  if(!value) return 'No registrada';
  const [year,month,day] = value.split('-').map(Number);
  if(!year || !month || !day) return escapePortalHtml(value);
  return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(year,month-1,day));
}

/* ---------------- Inicio ---------------- */
applyAccessibilitySettings();
renderScreen('login');
renderPortalAccess();
whenFirebaseReady()
  .then(FB => {
    if(!FB.configured){
      showPrototypeAlert('Firebase no está configurado. Complete los datos del archivo js/firebase-config.js antes de usar el sistema.', {title:'Configuración pendiente'});
    }
  })
  .catch(() => {
    showPrototypeAlert('No fue posible cargar Firebase. Verifica la conexión a internet y abre el proyecto desde un servidor web (por ejemplo, Live Server).', {title:'Sin conexión'});
  });
