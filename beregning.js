// Regnestykkene i Bedreliv, skilt ut fra index.html.
//
// Alt her er rene funksjoner: samme inn gir samme ut, ingen DOM, ingen nettverk,
// ingen skjult tilstand. Derfor kan de testes på millisekunder i Node i stedet
// for gjennom en nettleser — se tester/test_enhet.mjs.
//
// Lastes som vanlig <script> i appen (setter window.Beregning) og leses av
// testene med new Function(kilde + ';return Beregning;').
var Beregning = (function () {

  // ===== Løft og runder =====

  function volum(v, r) { return (v || 0) * (r || 0); }

  // Én øvelse i en økt er en liste med én post per runde. Økter lagret før
  // runder ble loggført har ett enkelt {vekt,reps} — de leses som én runde,
  // så gamle tall aldri forsvinner ut av loggen.
  function runderFor(okt, id) {
    var e = okt && okt.ovelser ? okt.ovelser[id] : null;
    if (!e) return [];
    if (Array.isArray(e)) return e.filter(function (r) { return r && r.vekt && r.reps; });
    return (e.vekt && e.reps) ? [e] : [];
  }

  // Alt som sammenliknes går på den TYNGSTE runden, ikke summen. Summen ville
  // falt bare fordi du rakk to runder i stedet for tre, og kalt en god dag et
  // tilbakesteg.
  function besteRunde(okt, id) {
    var beste = null;
    runderFor(okt, id).forEach(function (r) {
      if (!beste || volum(r.vekt, r.reps) > volum(beste.vekt, beste.reps)) beste = r;
    });
    return beste;
  }

  function volumSerieFra(liste, id) {
    var ut = [];
    liste.forEach(function (o) {
      var b = besteRunde(o, id);
      if (b) ut.push({ volum: volum(b.vekt, b.reps), vekt: b.vekt, reps: b.reps });
    });
    return ut;
  }

  // ===== Trend =====

  // Minste kvadraters stigningstall over de siste øktene, delt på snittvolumet.
  // Normaliseringen gjør at en tung øvelse ikke automatisk får en brattere
  // «trend» enn en lett — det er den relative endringen som betyr noe.
  var TREND_OKTER = 6;
  var TERSKEL = 0.02;   // under dette per økt heter det «likt»

  function trend(serie, maksOkter) {
    if (serie.length < 2) return null;
    var v = serie.slice(-(maksOkter || TREND_OKTER));
    var n = v.length;
    var snittX = (n - 1) / 2;
    var snittY = 0;
    for (var i = 0; i < n; i++) snittY += v[i].volum;
    snittY /= n;
    if (!snittY) return null;

    var teller = 0, nevner = 0;
    for (i = 0; i < n; i++) {
      teller += (i - snittX) * (v[i].volum - snittY);
      nevner += (i - snittX) * (i - snittX);
    }
    if (!nevner) return null;

    var pst = (teller / nevner) / snittY;   // endring per økt, som andel av snittet
    return {
      pst: pst,
      retning: pst > TERSKEL ? 'opp' : pst < -TERSKEL ? 'lettere' : 'likt',
      serie: v
    };
  }

  // Retningen til én person: flertallet av de øvelsesvise trendene. Totalvolum
  // per økt ville vært misvisende — en økt der man rakk to øvelser ville sett
  // ut som et fall.
  function personRetning(egneOkter, ovelseIder) {
    var tell = { opp: 0, likt: 0, lettere: 0 };
    ovelseIder.forEach(function (id) {
      var t = trend(volumSerieFra(egneOkter, id));
      if (t) tell[t.retning]++;
    });
    if (!tell.opp && !tell.likt && !tell.lettere) return null;
    return tell.opp > tell.lettere ? 'opp' : tell.lettere > tell.opp ? 'lettere' : 'likt';
  }

  // ===== Uker =====

  // Uker går fra mandag. Nøkkelen er selve mandagsdatoen, ikke et regnestykke
  // på millisekunder — sommertid flytter døgn med en time, og et uketall
  // regnet ut av differanser kan da havne i feil uke.
  function ukeStart(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  function ukeNokkel(d) { return ukeStart(d).toDateString(); }
  function forrigeUke(d) { return ukeStart(new Date(ukeStart(d).getTime() - 7 * 86400000)); }

  // Uker på rad med minst «malPerUke» økter. Inneværende uke er ennå ikke over,
  // så den bryter aldri rekka — er den ikke fylt opp, telles det fra forrige uke.
  function ukerPaaRad(dater, malPerUke, naa) {
    var mal = malPerUke || 2;
    var teller = {};
    dater.forEach(function (d) {
      var k = ukeNokkel(d);
      teller[k] = (teller[k] || 0) + 1;
    });
    var uke = ukeStart(naa || new Date());
    if ((teller[ukeNokkel(uke)] || 0) < mal) uke = forrigeUke(uke);
    var n = 0;
    while ((teller[ukeNokkel(uke)] || 0) >= mal) {
      n++;
      uke = forrigeUke(uke);
    }
    return n;
  }

  // ===== Utfylling av runder =====

  // Merkingen av hva brukeren selv har rørt er per FELT, ikke per runde.
  // Retter man reps i siste runde fordi forma sviktet, skal vekta der fortsatt
  // følge runde én — den har man ikke rørt.
  var RORT = { vekt: 'rortVekt', reps: 'rortReps' };

  function spreRunder(liste, antallRunder) {
    var forste = liste[0];
    if (!forste) return liste;
    for (var r = 1; r < antallRunder; r++) {
      if (!liste[r]) liste[r] = {};
      ['vekt', 'reps'].forEach(function (felt) {
        if (liste[r][RORT[felt]]) return;
        if (forste[felt] != null) liste[r][felt] = forste[felt];
      });
    }
    return liste;
  }

  // ===== Datoer =====

  function toSiffer(n) { return (n < 10 ? '0' : '') + n; }

  // <input type="date"> vil ha ÅÅÅÅ-MM-DD i LOKAL tid. Bruker man toISOString()
  // her, kan datoen hoppe en dag for den som er øst for Greenwich om kvelden.
  function datoFeltVerdi(iso) {
    var d = new Date(iso);
    return d.getFullYear() + '-' + toSiffer(d.getMonth() + 1) + '-' + toSiffer(d.getDate());
  }

  function datoTekst(iso) {
    var d = new Date(iso);
    var dager = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    var mnd = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
    return dager[d.getDay()] + ' ' + d.getDate() + '. ' + mnd[d.getMonth()];
  }

  return {
    volum: volum,
    runderFor: runderFor,
    besteRunde: besteRunde,
    volumSerieFra: volumSerieFra,
    trend: trend,
    personRetning: personRetning,
    ukeStart: ukeStart,
    ukeNokkel: ukeNokkel,
    forrigeUke: forrigeUke,
    ukerPaaRad: ukerPaaRad,
    spreRunder: spreRunder,
    RORT: RORT,
    toSiffer: toSiffer,
    datoFeltVerdi: datoFeltVerdi,
    datoTekst: datoTekst,
    TREND_OKTER: TREND_OKTER
  };
})();

if (typeof window !== 'undefined') window.Beregning = Beregning;
