module squid {
var id = 0;
export function parseRow(d) {
  var obj = {
    id: id++,
    x: +d.LON,
    y: +d.LAT,
    date: new Date(d.YEAR, d.MONTH, d.DAY),
    cpue: +d.CPUE,
    HM0: +d.HM0,
  };
  ['S', 'T', 'U', 'V', 'W'].forEach(v => {
    var i;
    for (i = 0; i < 54; ++i) {
      var val = +d[v + ('0' + (i + 1)).slice(-2)]
      obj[v + i] = val == -999 ? 0 : val;
    }
  });
  return obj;
}
}
