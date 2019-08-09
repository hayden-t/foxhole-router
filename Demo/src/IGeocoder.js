define(['leaflet', '../towns.json'], function (L, towns) {
    return {
        FoxholeGeocoder: function () {
            var FoxholeGeocoder = {
                /* distance between two strings */
                levinshtein: function (a, b) {
                    if (a.length == 0) return b.length;
                    if (b.length == 0) return a.length;

                    var matrix = [];

                    // increment along the first column of each row
                    var i;
                    for (i = 0; i <= b.length; i++) {
                        matrix[i] = [i];
                    }

                    // increment each column in the first row
                    var j;
                    for (j = 0; j <= a.length; j++) {
                        matrix[0][j] = j;
                    }

                    // Fill in the rest of the matrix
                    for (i = 1; i <= b.length; i++) {
                        for (j = 1; j <= a.length; j++) {
                            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                                matrix[i][j] = matrix[i - 1][j - 1];
                            } else {
                                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                                    Math.min(matrix[i][j - 1] + 1, // insertion
                                        matrix[i - 1][j] + 1)); // deletion
                            }
                        }
                    }

                    return matrix[b.length][a.length];
                },

                /* The geocoder resolve function, name -> location */
                geocode: function (q, callback, context) {
                    var query = q.toLowerCase();
                    var townkey = Object.keys(towns).find(key => key.toLowerCase() === query);
                    if (townkey != null) {
                        var town = towns[townkey];
                        let call = callback.bind(context);
                        var value = { center: L.latLng(town.y, town.x), name: query, bbox: L.latLngBounds(L.latLng(town.y, town.x), L.latLng(town.y, town.x)) };
                        return call([value], []);
                    }
                    else {
                        let call = callback.bind(context);
                        return call([], []);
                    }
                },

                /* The geocoding reverse lookup - nearest point */
                reverse: function (location, scale, callback, context) {
                    let call = callback.bind(context);
                    var townlist = Object.keys(towns);
                    if (townlist.length === 0)
                        return call([], []);
                    var distance = 10000000;
                    var index = -1;
                    for (var i = 0; i < townlist.length; i++) {
                        var disty = (location.lat - towns[townlist[i]].y);
                        var distx = (location.lng - towns[townlist[i]].x);
                        var dist_squared = distx * distx + disty * disty;
                        if (dist_squared < distance) {
                            distance = dist_squared;
                            index = i;
                        }
                    }
                    if (index == -1)
                        return call([], []);

                    var town = towns[townlist[index]];
                    var value = { center: L.latLng(town.y, town.x), name: townlist[index], bbox: L.latLngBounds(L.latLng(town.y, town.x), L.latLng(town.y, town.x)) }
                    return call([value], []);
                },

                /* Auto-suggest using indexof and levinshtein distance */
                suggest: function (q, callback, context) {
                    var query = q.toLowerCase();
                    let call = callback.bind(context);
                    var townlist = Object.keys(towns);
                    if (townlist.length === 0)
                        return call([], []);
                    var index = -1;
                    var results = [];
                    for (var i = 0; i < townlist.length; i++) {
                        var townname = townlist[i].toLowerCase();
                        if (townname.indexOf(query) >= 0) {
                            var d = FoxholeGeocoder.levinshtein(query, townname);
                            results.push({ name: townlist[i], distance: d });
                        }
                    }
                    results.sort(x => x.distance);
                    var output = [];
                    for (var i = 0; i < 5 && i < results.length; i++) {
                        var town = towns[results[i].name];
                        output.push({ center: L.latLng(town.y, town.x), name: results[i].name, bbox: L.latLngBounds(L.latLng(town.y, town.x), L.latLng(town.y, town.x)) });
                    }
                    return call(output, []);
                }
            };
            return FoxholeGeocoder;
        }
    };
});