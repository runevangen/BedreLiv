// Strekfigurer for øvelsene. To positurer per øvelse: start og slutt.
// Alle tegnes i samme rutenett (60 × 84), med bakken på y=78.
// I sidevisningene peker figuren mot høyre, og armene ligger litt foran
// kroppen så manualen ikke havner oppå kroppslinja.
var FIG = (function () {
  var svg = function (inner) {
    return '<svg viewBox="0 0 60 84" class="fig" aria-hidden="true">' +
      '<line class="bakke" x1="4" y1="78" x2="56" y2="78"/>' + inner + '</svg>';
  };

  function hode(x, y) {
    return '<circle class="kropp fyll" cx="' + x + '" cy="' + y + '" r="5"/>';
  }

  // strek(x1,y1, x2,y2, ...) — én sammenhengende strek gjennom punktene.
  function strek() {
    var p = arguments;
    var d = 'M' + p[0] + ' ' + p[1];
    for (var i = 2; i < p.length; i += 2) d += 'L' + p[i] + ' ' + p[i + 1];
    return '<path class="kropp" d="' + d + '"/>';
  }

  function vekt(x, y, w, h) {
    return '<rect class="vekt" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2"/>';
  }

  return {
    // Goblet knebøy — manualen holdes mot brystet
    'knebøy': [
      svg(hode(25, 13) + strek(25, 18, 25, 45) + strek(26, 24, 33, 32, 34, 26) +
        strek(25, 45, 27, 60, 25, 76) + strek(20, 78, 32, 78) + vekt(32, 21, 8, 10)),
      svg(hode(22, 26) + strek(22, 31, 21, 50) + strek(23, 37, 30, 44, 31, 38) +
        strek(21, 50, 36, 54, 27, 77) + strek(22, 78, 34, 78) + vekt(29, 33, 8, 10))
    ],

    // Manualpress — sett forfra
    'press': [
      svg(hode(30, 13) + strek(30, 18, 30, 46) + strek(20, 25, 40, 25) +
        strek(20, 25, 16, 34, 20, 27) + strek(40, 25, 44, 34, 40, 27) +
        strek(30, 46, 25, 60, 24, 76) + strek(30, 46, 35, 60, 36, 76) +
        strek(19, 78, 27, 78) + strek(33, 78, 41, 78) +
        vekt(13, 24, 11, 6) + vekt(36, 24, 11, 6)),
      svg(hode(30, 13) + strek(30, 18, 30, 46) + strek(20, 25, 40, 25) +
        strek(20, 25, 21, 9) + strek(40, 25, 39, 9) +
        strek(30, 46, 25, 60, 24, 76) + strek(30, 46, 35, 60, 36, 76) +
        strek(19, 78, 27, 78) + strek(33, 78, 41, 78) +
        vekt(15, 4, 11, 6) + vekt(34, 4, 11, 6))
    ],

    // Enarms roing — foroverbøyd, albuen dras opp bak ryggen
    'roing': [
      svg(hode(14, 26) + strek(18, 30, 38, 42) +
        strek(20, 33, 22, 56) + strek(38, 42, 37, 60, 36, 77) +
        strek(31, 78, 43, 78) + vekt(17, 56, 11, 6)),
      svg(hode(14, 26) + strek(18, 30, 38, 42) +
        strek(20, 33, 29, 29, 24, 44) + strek(38, 42, 37, 60, 36, 77) +
        strek(31, 78, 43, 78) + vekt(19, 43, 11, 6))
    ],

    // Rumensk markløft — hoftehengsel, rett rygg
    'markloft': [
      svg(hode(25, 13) + strek(25, 18, 25, 45) + strek(26, 24, 33, 43) +
        strek(25, 45, 27, 60, 25, 76) + strek(20, 78, 32, 78) +
        vekt(26, 40, 10, 6) + vekt(29, 43, 10, 6)),
      svg(hode(15, 24) + strek(19, 28, 37, 40) + strek(20, 30, 20, 55) +
        strek(37, 40, 34, 58, 32, 77) + strek(27, 78, 39, 78) +
        vekt(12, 52, 11, 6) + vekt(15, 55, 11, 6))
    ],

    // Utfall — steg fram, bakre kne senkes mot gulvet
    'utfall': [
      svg(hode(25, 13) + strek(25, 18, 25, 45) + strek(26, 24, 31, 44) +
        strek(25, 45, 27, 60, 25, 76) + strek(20, 78, 32, 78) +
        vekt(24, 41, 10, 6) + vekt(27, 44, 10, 6)),
      svg(hode(25, 14) + strek(25, 19, 25, 46) + strek(26, 25, 31, 45) +
        strek(25, 46, 38, 57, 38, 76) + strek(34, 78, 45, 78) +
        strek(25, 46, 18, 66, 13, 77) + strek(9, 78, 18, 78) +
        vekt(24, 42, 10, 6) + vekt(27, 45, 10, 6))
    ]
  };
})();

if (typeof window !== 'undefined') window.FIG = FIG;
