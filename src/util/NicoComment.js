module.exports = (() => {
  "use strict";
  
  var fs = require("fs"),
      xml = require("xml2js").parseString;
  
  var NicoComment = class {
    
    constructor() {
      this._comment = [];
    }
    
    get comment() {
      return this._comment;
    }
    
    readFromFile(path) {
      var deferred = Promise.defer();
      
      fs.readFile(path, "utf8", ((err, data) => {
        if (err) return deferred.reject(err);
        this.read(data).then(r => deferred.resolve(r));
      }).bind(this));
      
      return deferred.promise;
    }
    
    read(data) {
      var deferred = Promise.defer();
      
      this.clear();
      xml(data, ((err, result) => {
        if (err) return deferred.reject(err);
        
        if (!result || !result.packet || !result.packet.chat) {
          return deferred.resolve(this._comment);
        }
        
        result.packet.chat.forEach((chat => {
          this._comment.push(this._parseChat(chat))
        }).bind(this));
        
        deferred.resolve(this._comment);
      }).bind(this));
      
      return deferred.promise;
    }
    
    write() {
      
    }
    
    writeToFile(path) {
      var deferred = Promise.defer();
      
      deferred.reject(new Error("not implemented"));
      
      return deferred.promise;
    }
    
    addChat(chat) {
      var comment = this._comment;
      (Array.isArray(chat) ? chat : [chat]).forEach(c => {
        comment.push(c);
      });
    }
    
    clear() {
      this._comment = [];
    }
    
    _parseChat(chat) {
      var color = null, size = null, position = null;
      
      if (chat.$.mail) {
        chat.$.mail.split(" ").forEach(command => {
          if (NicoComment.size.indexOf(command) >= 0)
            size = command;
          else if (NicoComment.position.indexOf(command) >= 0)
            position = command;
          else if (NicoComment.color.indexOf(command) >= 0)
            color = command;
        });
      }
      
      return {
        text: chat._,
        vpos: chat.$.vpos,
        color: color,
        size: size,
        position: position
      };
    }
    
  };
  
  NicoComment.color = [
    "red", "pink", "orange", "yellow", "green", "cyan", "blue", "purple", "black",
    "white2", "niconicowhite", "red2", "truered", "pink2", "orange2",
    "passionorange", "yellow2", "madyellow", "green2", "elementalgreen",
    "cyan2", "blue2", "marineblue", "purple2", "nobleviolet", "black2"
  ];
  NicoComment.size = ["big", "small"];
  NicoComment.position = ["ue", "shita"];
  
  return NicoComment;
})();
