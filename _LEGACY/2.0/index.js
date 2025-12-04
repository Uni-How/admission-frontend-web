const http = require('http');
const fs = require("fs");
const server = http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"})
    fs.readFile("index.html", (e, data)=>{
        if(e){
            console.log("ERROR loading file");
        }else{
            res.write(data);
            res.end()
        }
    });
});


server.listen(3000, () =>{
    console.log("listening on port 3000");
});