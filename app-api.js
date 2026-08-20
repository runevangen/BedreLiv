// Tynn klient mot backenden — innlogging og lagring av økter.
// Samme mønster som pizzame: innlogget bruker ligger i localStorage som
// { id, name }, og hvert kall sender med userId. Ingen sesjonstokens.

var Api = (function () {
  var USER_KEY = 'bedrelivUser';

  // ===== Innlogget bruker =====
  function currentUser() {
    try {
      var u = JSON.parse(localStorage.getItem(USER_KEY));
      return u && u.id ? u : null;
    } catch (e) {
      return null;
    }
  }

  function currentUserId() {
    var u = currentUser();
    return u ? u.id : null;
  }

  function currentUserName() {
    var u = currentUser();
    return u ? u.name : null;
  }

  function setUser(u) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify({ id: u.id, name: u.name }));
    } catch (e) {}
  }

  function logout() {
    try { localStorage.removeItem(USER_KEY); } catch (e) {}
  }

  // ===== Felles fetch-hjelper =====
  // Kaster Error med serverens egen feilmelding når den finnes, så front-end
  // kan vise noe fornuftig i stedet for «Ukjent feil».
  function call(path, options) {
    return fetch(path, options).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (body) {
        if (!res.ok) {
          throw new Error((body && body.error) || ('Feil fra server (' + res.status + ')'));
        }
        return body;
      });
    });
  }

  // ===== Brukere =====
  function nameExists(name) {
    return call('/api/users?name=' + encodeURIComponent(name)).then(function (r) {
      return !!r.exists;
    });
  }

  function register(name, pin) {
    return call('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, pin: pin })
    }).then(function (r) {
      setUser({ id: r.id, name: r.name });
      return r;
    });
  }

  // Feil PIN gir 401 fra serveren. Det er en forventet utgang, ikke en krasj,
  // så den returnerer null i stedet for å kaste.
  function login(name, pin) {
    return fetch('/api/users/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, pin: pin })
    }).then(function (res) {
      if (res.status === 401) return null;
      if (!res.ok) throw new Error('Feil fra server (' + res.status + ')');
      return res.json().then(function (r) {
        setUser({ id: r.id, name: r.name });
        return r;
      });
    });
  }

  // Alle registrerte, så gjengen kan vise folk før de har trent.
  function listBrukere() {
    var uid = currentUserId();
    return call('/api/users/gjengen' + (uid ? '?userId=' + encodeURIComponent(uid) : ''))
      .then(function (r) { return r.brukere || []; });
  }

  // ===== Økter =====
  // Serveren sorterer eldst først, som er rekkefølgen front-end regner
  // «forrige økt» ut fra.
  function listOkter() {
    var uid = currentUserId();
    return call('/api/okter' + (uid ? '?userId=' + encodeURIComponent(uid) : '')).then(function (r) {
      return r.okter || [];
    });
  }

  function saveOkt(ovelser, dato) {
    return call('/api/okter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ovelser: ovelser,
        dato: dato || new Date().toISOString(),
        ownerId: currentUserId(),
        savedBy: currentUserName()
      })
    });
  }

  // Heia på en venns økt. Trykker du igjen, tas heiaropet bort — samme kall.
  // Serveren svarer med hele lista, så klienten slipper å gjette utfallet.
  function heiarop(oktId) {
    return call('/api/okter/' + encodeURIComponent(oktId) + '/heiarop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId(), navn: currentUserName() })
    });
  }

  function deleteOkt(id) {
    var uid = currentUserId();
    return call(
      '/api/okter/' + encodeURIComponent(id) + (uid ? '?userId=' + encodeURIComponent(uid) : ''),
      { method: 'DELETE' }
    );
  }

  return {
    currentUser: currentUser,
    currentUserId: currentUserId,
    currentUserName: currentUserName,
    logout: logout,
    nameExists: nameExists,
    register: register,
    login: login,
    listBrukere: listBrukere,
    listOkter: listOkter,
    saveOkt: saveOkt,
    heiarop: heiarop,
    deleteOkt: deleteOkt
  };
})();

if (typeof window !== 'undefined') window.Api = Api;
