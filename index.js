const Path = require('path');
const Send = require('koa-send');
const RootPath = process.cwd();

module.exports = function(options){
    let staticUrlPath = [];
    let staticLocalPath = [];
    for (var url in options){
        var item = options[url];
        if (item.path){
            staticUrlPath.push(Path.resolve(url) + '/');
            staticLocalPath.push(Path.resolve(RootPath, item.path) + '/');
        }
    };    
    return async function(ctx, next){        
        for (var i = 0; i < staticUrlPath.length; i ++){            
            if (ctx.path.indexOf(staticUrlPath[i]) === 0){                    
                var path = Path.resolve(staticLocalPath[i], ctx.path.slice(staticUrlPath[i].length));                    
                if (path.indexOf(staticLocalPath[i]) === 0){                    
                    try{
                        await Send(ctx, path, {root: '/'})
                    }
                    catch(err){
                        ctx.status = 404;    
                    }                    
                }                        
                else
                    ctx.status = 404;
                return;
            }
        }
        await next();
    }
}