// jet color map
var interp = function (x, y0, x0, y1, x1) { return (x-x0)*(y1-y0)/(x1-x0) + y0; }
var jet = {
  base: function (x) {
    if      (x <= -0.75) return 0;
    else if (x <= -0.25) return interp(x, 0.0, -0.75, 1.0, -0.25);
    else if (x <=  0.25) return 1.0;
    else if (x <=  0.75) return interp(x, 1.0, 0.25, 0.0, 0.75);
    else return 0.0;
  },
  r: function(x) { return jet.base(x - 0.5); },
  g: function(x) { return jet.base(x); },
  b: function(x) { return jet.base(x + 0.5); },
  rgb: function(x) { return 'rgb(' + (jet.r(x)*255) + ',' + (jet.g(x)*255) + ',' + (jet.b(x)*255) + ')'; }
}