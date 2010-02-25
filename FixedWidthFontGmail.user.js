// ==UserScript== 
// @name          Gmail MonoSpace Font 
// @namespace     http://gambits.org
// @description   Use a Monospaced(Fixed) font in message bodies and textarea for GMail. 
// @match       http://mail.google.com/* 
// @match       https://mail.google.com/* 
// @run-at document-start
// ==/UserScript== 
(function () { 
        var styles = "div.ii, div.At, textarea.Ak, textarea.dV {font-family: monospace !important; font-size: 12px !important; }"; 
        var heads  = document.getElementsByTagName("head"); 
        if (heads.length > 0) { 
                var node = document.createElement("style"); 
                node.type = "text/css"; 
                node.appendChild(document.createTextNode(styles)); 
                heads[0].appendChild(node); 
        } 
}) (); 
