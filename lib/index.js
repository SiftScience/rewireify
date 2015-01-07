var through = require("through");
var path = require("path");
var minimatch = require("minimatch");

module.exports = function rewireify(file, options) {
  options = {
    include: options.include || [],
    exclude: options.exclude || []
  };

  var ignore = ["__get__", "__set__", "rewire"];

  if (/\.json$/.test(file) || ignore.indexOf(path.basename(file, ".js")) > -1) {
    return through();
  }

  var i;
  for (i = 0; i < options.exclude.length; i++) {
    if (minimatch(file, options.exclude[i])) {
      return through();
    }
  }

  var included = false;
  for (i = 0; i < options.include.length; i++) {
    if (minimatch(file, options.include[i])) {
      included = true;
    }
  }

  if (!included) {
      return through();
  }

  var data = "";
  var post = "";
  var __get__ = require("./__get__").toString();
  var __set__ = require("./__set__").toString();

  function write(buffer) {
    data += buffer;
  }

  function end() {
    post += "/* This code was injected by Rewireify */\n";
    post += "module.exports.__get__ = " + __get__ + ";\n";
    post += "module.exports.__set__ = " + __set__ + ";\n";

    this.queue(data);
    this.queue(post);
    this.queue(null);
  }

  return through(write, end);
};
