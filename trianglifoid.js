/* jshint esnext:true */

var debug = typeof v8debug === 'object';
var express = require('express');
var Trianglify = require('trianglify');
var XMLSerializer = require('xmlserializer');
var cluster = require('express-cluster');
var Cache = require("file-system-cache").default;

 
const cache = Cache({
  basePath: "/tmp/trianglifoid.cache",  
  ns: "trianglifoid"  
});


function main(){
    var app = express();
    app.get('/trianglify', function(req, res) {
        res.setHeader("Content-Type", "image/svg+xml");
        var article_id = req.query.id;
        if (article_id === undefined){
            article_id = 1;
        }
        cache.get(article_id)
            .then(function(result){
                if (!result) throw new Error('undef');
                return res.send(result)
            })            
            .catch(function(err){
                var cell_size = 16 + (2 ^ article_id % 84);
                var variance = (2 ^ article_id % 128) * 1.0 / 128;
                var stroke_width = (2 ^ article_id % 128) * 12.0 / 128;
                var colorbrewer_names = [
                    'YlGn', 'YlGnBu', 'GnBu', 'BuGn', 'PuBuGn', 'PuBu',
                    //'BuPu',
                    'RdPu',
                        'PuRd', 'OrRd', 'YlOrRd', 'YlOrBr', 'Purples', 'Blues', 'Greens',
                        'Oranges', 'Reds', 'Greys', 'PuOr', 'BrBG', 'PRGn', 'PiYG',
                        'RdBu', 'RdGy', 'RdYlBu', 'Spectral', 'RdYlGn', 'Accent', 'Dark2',
                        'Paired', 'Pastel1', 'Pastel2', 'Set1', 'Set2', 'Set3'
                ];
                var color_name = colorbrewer_names[2 ^ article_id % colorbrewer_names.length];
                var pattern = Trianglify({
                    cell_size: cell_size,
                    variance: variance,
                    x_colors: color_name,
                    y_colors: 'match_x',
                    palette: Trianglify.colorbrewer,
                    stroke_width: stroke_width,
                    width: 256*3,
                    height: 256*1
                });
                var svg_pattern = XMLSerializer.serializeToString(pattern.svg());
                cache.save([{key: article_id, value: svg_pattern}]);
                return res.send(svg_pattern);
        });
    });

    app.listen(8088);
}

if (debug){
    main();
} 
else {
    cluster(function(worker) {
    main();
    }); 
}
