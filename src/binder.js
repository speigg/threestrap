THREE.Binder = {
  bind: function (context, globals) {
    return function (key, object) {

      // Prepare object
      if (!object.__binds) {
        object.__binds = [];
      }

      // Set base target
      var fallback = context;
      if (_.isArray(key)) {
        fallback = key[0];
        key = key[1];
      }

      // Match key
      var match = /^([^.:]*(?:\.[^.:]+)*)?(?:\:(.*))?$/.exec(key);
      var path = match[1].split(/\./g);

      var name = path.pop();
      var dest = match[2] || name;

      // Whitelisted objects
      var selector = path.shift();
      var target = {
        'this': object,
      }[selector] || globals[selector] || context[selector] || fallback;

      // Look up keys
      while (target && (key = path.shift())) { target = target[key] };

      // Attach event handler at last level
      if (target && (target.on || target.addEventListener)) {
        var callback = function (event) {
          object[dest] && object[dest](event, context);
        };

        // Polyfill for both styles of event listener adders
        THREE.Binder._polyfill(target, [ 'addEventListener', 'on' ], function (method) {
          target[method](name, callback);
        });

        // Store bind for removal later
        var bind = { target: target, name: name, callback: callback };
        object.__binds.push(bind);
      }
      else {
        throw "Cannot bind '" + key + "' in " + this.__name;
      }
    };
  },

  unbind: function () {
    return function (object) {
      // Remove all binds belonging to object
      if (object.__binds) {

        object.__binds.forEach(function (bind) {

          // Polyfill for both styles of event listener removers
          THREE.Binder._polyfill(bind.target, [ 'removeEventListener', 'off' ], function (method) {
            bind.target[method](bind.name, bind.callback);
          });
        }.bind(this));

        object.__binds = [];
      }
    }
  },

	apply: function ( object ) {

		THREE.EventDispatcher.prototype.apply(object);

		object.trigger = THREE.Binder._trigger;

		object.on = object.addEventListener;
		object.off = object.removeEventListener;
		object.dispatchEvent = object.trigger;

	},

  ////

  _trigger: function (event) {

		if (this._listeners === undefined) return;

		var listenerArray = this._listeners[event.type];

		if (listenerArray !== undefined) {

      listenerArray = listenerArray.slice()
      var length = listenerArray.length;

			event.target = this;
			for (var i = 0; i < length; i++) {
			  // add original target as parameter for convenience
				listenerArray[i].call(this, event, this);
			}

		}

  },

  _polyfill: function (object, methods, callback) {
    methods.map(function (method) { return object.method });
    if (methods.length) callback(methods[0]);
  },

};