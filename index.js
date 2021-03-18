const Path = require('path');
const RootPath = process.cwd();
const Fs = require('fs')
const Stat = require('util').promisify(Fs.stat);

var StaticUrlPath = [];
var StaticLocalPath = [];
var StaticLocalFile = {};

function getFullPath(root, ...paths){    
    let rootPath = root;
    if (rootPath.slice(-1) != '/')
        rootPath += '/'
    let result = root;    
    if (Array.isArray(paths)){
        for (var i = 0; i < paths.length; i ++){
            result = Path.join(result, paths[i])
            if (result.indexOf(rootPath) != 0)
                return;
        }        
        return result
    }    
    else
        return;
}
function readFile(ctx, path){
   return new Promise(async function(resolve, reject){
        try{            
            let stat = await Stat(path);
            if (stat.isDirectory())
                return reject()
            ctx.set('Content-Length', stat.size);
            ctx.set('Last-Modified', stat.mtime.toUTCString())
            ctx.type = Path.extname(Path.basename(path));
            ctx.body = Fs.createReadStream(path)
            resolve();
        }
        catch(err){
            reject(err)
        }
   }) 
}
module.exports = {
    _init: function(options){
        StaticUrlPath = [];  
        StaticLocalPath = [];
        StaticLocalFile = {};
        if (options.route){
            for (var url in options.route){
                var item = options.route[url];
                if (item.file){
                    StaticLocalFile[url] = item.file
                }
                else if (item.path){
                    StaticUrlPath.push(Path.resolve(url) + '/');
                    StaticLocalPath.push(Path.resolve(RootPath, item.path) + '/');
                }
            }; 
        }
    },
    _middleware: async function(ctx, next){
        if (ctx.method == 'GET'){            
            if (StaticLocalFile[ctx.path]){
                try{
                    await readFile(ctx, StaticLocalFile[ctx.path])                        
                    return;
                }
                catch(err){} 
            }
            else{
                for (let i = 0; i < StaticUrlPath.length; i ++){                            
                    if (ctx.path.indexOf(StaticUrlPath[i]) === 0){
                        let path = getFullPath(StaticLocalPath[i], ctx.path.slice(StaticUrlPath[i].length));
                        try{
                            await readFile(ctx, path)                        
                            return;
                        }
                        catch(err){
                            break;
                        }
                    }
                }
            }            
            await next();
        }
        else            
            await next();
    }
}