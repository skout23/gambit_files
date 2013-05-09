// ==UserScript==
// @name        Pizzabagel the Third
// @version     3.0.1
// @identifier  http://pimpninjas.org/greasemonkey/pizzabagel3.user.js
// @description Is always unreasonably hard. Sometimes stabs hookers.
// @include     http://turntable.fm/*
// ==/UserScript==

// timer debugging split into
// http://pegasus.pimpninjas.org/greasemonkey/timerleakchecker.user.js

// runtime script injection
var script = document.head.appendChild(document.createElement('script'));
script.setAttribute('type', 'text/javascript');
script.textContent = function () {
        // this method developed in conjunction with ArmEagle (armeagle.nl)
        var content = arguments.callee.toString();
        return content.replace(/[\s\S]*"\$1"\);([\s\S]*)}/,"$1");
        // this script has been inserted at runtime

        // set up our main object
        var pizzabagel = {
                VERSION: "3.0.1",
                persist: {},
                hooked: {},
                controls: {},
                timers: {},
                log: function (msg) { return console.log("PB3: " + msg); },
                load: function () {
                        if (window.localStorage) {
                                if (localStorage &&
                                        undefined !== localStorage.pizzabagel &&
                                        null !== localStorage.pizzabagel &&
                                        "null" !== localStorage.pizzabagel
                                ) this.persist = JSON.parse(localStorage.pizzabagel);
                        } else {
                                alert(
                                        "Persistent storage is not available in your browser.\n" +
                                        "You may want to upgrade, or try another browser entirely.\n" +
                                        "pizzabagel3 will still function, but will lose settings across page reloads."
                                );
                        }
                        return this.persist;
                },
                save: function () {
                        localStorage.pizzabagel = JSON.stringify(this.persist);
                        return this.load();
                },
                refresh: function () {
                        for (i in this.controls) {
                                this.controls[i].style.background = this.persist[i] ? "#8f8" : "#400";
                                this.controls[i].style.color = this.persist[i] ? "#000" : "#ccc";
                        }
                },
                toggle: function (which) {
                        this.persist[which] = !this.persist[which];
                        this.save();
                        this.refresh();
                        switch (which) {
                                case "autodj":
                                        if (this.timers.autodj) {
                                                clearTimeout(this.timers.autodj);
                                                delete this.timers.autodj;
                                        }
                                        if (this.timers.stopdj) clearTimeout(this.timers.stopdj);
                                        this.timers.stopdj = setTimeout(function () {
                                                delete this.timers.stopdj;
                                        }.bind(this), 1000);
                                        if (
                                                !this.room.isDj() && this.persist.autodj && 
                                                this.room.numDjs() < this.view.attributes.numDjSpots
                                        ) this.view.callback("become_dj");
                                        else if (this.room.isDj() && !this.persist.autodj)
                                                this.hooked.quitDj.apply(this.room);
                                        break;
                                case "autobob":
                                        if (this.timers.autobob) {
                                                clearInterval(this.timers.autobob);
                                                delete this.timers.autobob;
                                        }
                                        this.controls.autobob.innerHTML = "AutoBob";
                                break;
                        }
                },
                style: document.head.appendChild(document.createElement("style")),
                box: document.body.appendChild(document.createElement("div")),
                autobob: function () {
                        if (this.timers.autobob) {
                                clearInterval(this.timers.autobob);
                                delete this.timers.autobob;
                        }
                        if (!this.persist.autobob) return;
                        this.controls.autobob.innerHTML = "Bobbing!";
                        if (0 <= this.room.upvoters.indexOf(turntable.user.id)) return;
                        // update mouse idle variable, just in case
                        turntable[this.idlevar] = Date.now();
                        this.view.callback("upvote");
                },
                unproxy: function (objectArray) {
                        // "that looks long and hard" - lagshot
                        // fuck i love javascript. almost as fun as perl.
                        objectArray.map(function (n) {
                                // Remove toString overrides
                                for (var i in n) if ("function" === typeof n[i]) delete n[i].toString;
                                // display jQuery proxy wrappers as if they didn't exist
                                for (var i in n) {
                                        if (
                                                "function (){return a.apply(c,e.concat(k.call(arguments)))}" !=
                                                ("" + n[i])
                                        ) continue;
                                        n[i].toString = function (o) {
                                                return function (){return o.toString();}
                                        }(n.__proto__[i]);
                                }
                        });
                },
                start: function () {
                        this.log("This is pizzabagel v" + this.VERSION);
                        this.timers.wait = setInterval(this.init.bind(this), 1000);
                },
                init: function () {
                        // load saved settings immediately
                        this.load();
                        window.DEBUG_MODE = this.persist.debugmode;

                        // wait for turntable to boot
                        if (undefined === this.view)
                                for (var i in window) {
                                        if (window[i] && undefined !== window[i].djs) {
                                                this.view = window[i];
                                                this.log("Found view object at " + i);
                                                break;
                                        }
                                }
                        if (undefined === this.view) return;

                        for (var i in turntable) {
                                if (turntable[i] && "function" === typeof turntable[i].isDj) {
                                        this.room = turntable[i];
                                        this.log("Found room object at " + i);
                                        break;
                                }
                        }
                        if (undefined === this.room) return;

                        clearInterval(this.timers.wait);
                        delete this.timers.wait;

                        // early become_dj call
                        if (
                                !this.room.isDj() && this.persist.autodj &&
                                this.room.numDjs() < this.view.attributes.numDjSpots
                        ) this.view.callback("become_dj");

                        // undo the mangling that jQuery's proxy system does
                        // stupid jQuery shit isn't even necessary
                        // see THIS FUCKING FILE for examples of how to bind your
                        // own damn callbacks to your own damn contexts AND how to
                        // call functions from foreign contexts into your context
                        this.unproxy([this.room, this.view, turntable]);

                        // do runtime inspection and hackery

                        // find and report mouse idle timestamp
                        this.idlevar = ('' + turntable.idleTime).match(/-[^.]*\.([^;]*)/)[1];
                        this.log("Found mouse idle timestamp at " + this.idlevar);

                        // kill mouse idle function
                        for (var i in turntable) {
                                if (
                                        "idleTime" == i || "function" !== typeof turntable[i] ||
                                        ("" + turntable[i]) != ("" + turntable.idleTime)
                                ) continue;
                                turntable[i] = function (){return 0};
                                turntable.idleTime = function (){return 0};
                                this.log("Mouse idle function " + i + " disabled");
                        }

                        // kill DMCA mute and sleeping DJ timeout
                        // tt.fm/pizzabagel supports sleepstep

                        // for now, this line appears to be sufficient
                        this.room.roomData.metadata.single_dj_enabled = true;
                        this.log("Enabled single DJ mode.");

                        // sleeping DJ timeout blocker goes here, if/when needed

                        // DMCA mute blocker goes here, if/when needed

                        // install hooks

                        // autobob
                        this.hooked.newsong = this.view.newsong;
                        this.view.newsong = function (djId, artist, title, length) {
                                var ret = this.hooked.newsong.apply(this.view, arguments);
                                if (0 <= this.room.upvoters.indexOf(turntable.user.id)) {
                                        this.controls.autobob.innerText = "Bobbing!";
                                        return ret;
                                }
                                if (this.view.current_dj[0] == turntable.user.id) {
                                        this.controls.autobob.innerText = "Spinning!";
                                        return ret;
                                }
                                this.autobob.deadline = Date.now() + (length / 6 + length / 3 * Math.random()) * 1000;
                                if (this.timers.autobob) {
                                        clearInterval(this.timers.autobob);
                                        delete this.timers.autobob;
                                }
                                // fork and delay less than a second
                                setTimeout(function () {
                                        if (undefined === this.timers.autobob)
                                                this.timers.autobob = setInterval(function () {
                                                        var timeleft = this.autobob.deadline - Date.now();
                                                        if (timeleft <= 0) this.autobob();
                                                        else this.controls.autobob.innerText = "Bob: " + 
                                                                Math.ceil(timeleft / 1000) + "s";
                                                }.bind(this), 1000);
                                }.bind(this), this.autobob.deadline % 1000)
                                return ret;
                        }.bind(this);

                        // autodj
                        this.hooked.shuffle = this.view.shuffleDjSpots;
                        this.view.shuffleDjSpots = function (numDjs, change) {
                                var ret = this.hooked.shuffle.apply(this.view, arguments);
                                if (this.timers.stopdj) return ret;
                                if (
                                        !this.room.isDj() && this.persist.autodj &&
                                        this.room.numDjs() < this.view.attributes.numDjSpots
                                ) {
                                        this.log("Slot opened, attempting to get on deck...");
                                        // turn autodj mode off for two seconds
                                        // to avoid getting chucked out of the room
                                        if (this.timers.autodj) {
                                                clearTimeout(this.timers.autodj);
                                                delete this.timers.autodj;
                                        }
                                        this.timers.autodj = setTimeout(function () {
                                                this.persist.autodj = true;
                                                this.save();
                                                this.refresh();
                                        }.bind(this), 2000);
                                        this.persist.autodj = false;
                                        this.view.callback("become_dj");
                                        this.save();
                                        this.refresh();
                                }
                                return ret;
                        }.bind(this);
                        this.hooked.quitDj = this.room.quitDj;
                        this.room.quitDj = function () {
                                if (this.timers.stopdj) clearTimeout(this.timers.stopdj);
                                this.timers.stopdj = setTimeout(function () {
                                        delete this.timers.stopdj;
                                }.bind(this), 2000);
                                this.hooked.quitDj.apply(this.room, arguments);
                        }.bind(this);

                        // UI setup

                        // inject CSS
                        this.style.type = "text/css";
                        // would be nice if there was a HEREDOC standard for JS.
                        this.style.textContent = "#pizzabagel {\
        text-align: center;\
        visibility: hidden;\
        margin: 0; padding: 0;\
        -moz-border-radius: 5px;\
        border-radius: 5px;\
        position: fixed;\
        top: 0;\
        left: 0;\
        width: 154px;\
        background: #444;\
        color: #fff;\
        border: 1px solid #000;\
        z-index: 999999;\
}\
#pizzabagel * {\
        font-family: Helvetica, Arial, sans-serif;\
        font-variant: small-caps;\
        font-size: 10pt;\
        -moz-border-radius: 5px;\
        border-radius: 5px 5px;\
        padding: 2px 5px;\
}\
#pizzabagel h3 {\
        margin: 0;\
        -moz-border-radius: 5px 5px 0 0;\
        border-radius: 5px 5px 0 0;\
        border-bottom: 1px solid #000;\
        border-top: 1px solid #000;\
        cursor: default;\
        margin-bottom: 4px;\
}\
#pizzabagel h3:first-child { border-top: 0; }\
#pizzabagel button {\
        width: 75px;\
        margin: 1px; border: 0;\
}\
#pizzabagel sup {\
        padding: 0;\
        font-size: .6em;\
}\
#pizzabagel ul { list-style: none; padding: 0; }\
#pizzabagel ul li { text-align: center; white-space: nowrap; overflow: hidden; }\
}";
                        document.head.appendChild(this.style);
                        delete this.style;

                        // inject widget
                        this.box.id = "pizzabagel";
                        this.box.innerHTML = "<h3>pizzabagel<sup>3</sup>" +
                                '<span style="font-size:.75em">v' + this.VERSION + "</span></h3>";
                        /* hmmm...
                        ["autobob", "autodj" ].map(function (i) { (function (i) {
                                this.controls[i] = document.body.appendChild(this.button());
                                this.controls[i].onclick = function () {
                                        this.toggle(i);
                                }.bind(this);
                        }).apply(pizzabagel, arguments); });
                        */
                        this.button = {
                                data: { autobob: "AutoBob", autodj: "AutoDJ" },
                                create: function () { return document.createElement("button"); }
                        };
                        for (var i in this.button.data) {
                                this.controls[i] = this.box.appendChild(this.button.create());
                                this.controls[i].onclick = function (c, i) { return function () {
                                        this.toggle(i);
                                }.bind(c); }(this, i);
                                this.controls[i].innerHTML = this.button.data[i];
                        }
                        delete this.button;
                        this.box.style.top = this.persist.top;
                        this.box.style.left = this.persist.left;
                        this.refresh();

                        // the only jQuery dependency in this bitch
                        $("#pizzabagel").draggable({
                                handle: "h3",
                                stop: function () {
                                        this.persist.top = this.box.style.top;
                                        this.persist.left = this.box.style.left;
                                        this.save();
                                }.bind(this),
                                containment: "window",
                                scroll: false
                        });
                        // end jQuery code

                        // reveal the widget now that setup is complete
                        this.box.style.visibility = "visible";

                        // have a little fun with it
                        this.view.loadingmessages = [
                                "the pizzas are bageling",
                                "go ahead - pizza your bagel",
                                "at least you got pizzabagels",
                                "we're bageling your pizza",
                                "don't think of pizzabagels",
                                "follow the pizzabagel",
                                "pizzalating bagels",
                                "bagelating pizzas",
                                "being unreasonably hard",
                                "stabbing hookers",
                                "pizza load bagel"
                        ];
                }
        };

        // only run if we're actually in a room
        if (document.getElementById('turntable')) pizzabagel.start();
}();
