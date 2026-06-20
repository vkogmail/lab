/* Load in <head> before brand.css to avoid theme flash */
try {
  var t = localStorage.getItem("theme");
  if (t) document.documentElement.setAttribute("data-theme", t);
} catch (e) {}
